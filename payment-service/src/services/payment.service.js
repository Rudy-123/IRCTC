const paymentProducer = require("../kafka/producer/payment.producer");
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
} = require("../utils/error");

const withIdempotency = async (key, fn) => {
  const existing = await prisma.idempotencyRecord.findUnique({
    where: { eventKey: key },
  });
  if (existing) {
    logger.info(`Idempotent request detected: ${key}`);
    return existing.response;
  }
  const result = await fn();

  await prisma.idempotencyRecord.create({
    data: { eventKey: key, response: result },
  });

  return result;
};
const createPaymentOrder = async (
  bookingId,
  amount,
  userId,
  idempotencyKey,
) => {
  if (!bookingId || !amount || !userId || !idempotencyKey) {
    throw new BadRequestError(
      "Booking id, amount, userid, idempotencykey is/are required",
    );
  }
  if (amount <= 0) {
    throw new BadRequestError("Amount must be greater than 0");
  }

  return withIdempotency(`payment-order:${idempotencyKey}`, async () => {
    const gateway = getGateway(); //gave the razorpay instance
    const gatewayResult = await gateway.createOrder(amount, "INR", bookingId, {
      bookingId,
      userId,
    });
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        userId,
        amount,
        currency: "INR",
        status: "CREATED",
        idempotencyKey,
        gatewayProvider: config.PAYMENT_GATEWAY,
        gatewayOrderId: gatewayResult.gatewayOrderId,
      },
    });
    // Audit log
    await prisma.paymentAuditLog.create({
      data: {
        paymentOrderId: paymentOrder.id,
        action: "ORDER_CREATED",
        gatewayResponse: gatewayResult.rawResponse,
        metadata: { bookingId, userId, amount },
      },
    });
    logger.info(`Payment order created: ${paymentOrder.id}`, {
      bookingId,
      gatewayOrderId: gatewayResult.gatewayOrderId,
    });
    return {
      paymentOrderId: paymentOrder.id,
      gatewayOrderId: gatewayResult.gatewayOrderId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      status: paymentOrder.status,
      gatewayProvider: paymentOrder.gatewayProvider,
      keyId: config.RAZORPAY_KEY_ID,
    };
  });
};

// ─── Verify and Capture (client-side verification) ─────────────────────

const verifyAndCapturePayment = async (
  paymentOrderId,
  gatewayPaymentId,
  gatewaySignature,
) => {
  if (!paymentOrderId || !gatewayPaymentId || !gatewaySignature) {
    throw new BadRequestError(
      "paymentorderid, gatewaypaymentid and gatewaysignature are required",
    );
  }
  const paymentOrder = await prisma.paymentOrder.findUnique({
    where: { id: paymentOrderId },
  });
  if (!paymentOrder) {
    throw new NotFoundError("Payment Order not found");
  }
  if (paymentOrder.status === "CAPTURED") {
    return {
      paymentOrderId: paymentOrder.id,
      status: "CAPTURED",
      gatewayPaymentId: paymentOrder.gatewayPaymentId,
      message: "Payment already captured",
    };
  }
  if (paymentOrder.status !== "CREATED") {
    throw new ConflictError(
      `Payment Order is in ${paymentOrder.status} status`,
    );
  }
  const gateway = getGateway();

  //verify the signature
  const isValid = gateway.verifyPaymentSignature(
    paymentOrder.gatewayOrderId,
    gatewayPaymentId,
    gatewaySignature,
  );

  await prisma.paymentAuditLog.create({
    data: {
      paymentOrderId: paymentOrder.id,
      action: isValid ? "SIGNATURE_VERIFIED" : "SIGNATURE_VERIFICATION_FAILED",
      metadata: { gatewayPaymentId, isValid },
    },
  });
  if (!isValid) {
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        status: "FAILED",
        failureReason: "signature_verification_failed",
        version: { increment: 1 },
      },
    });
    await paymentProducer
      .publishPaymentFailed(
        paymentOrder.id,
        paymentOrder.bookingId,
        "signature_verification_failed",
      )
      .catch((err) => {
        logger.error(
          "Failed to publish payment failed after signature failure",
          { error: err.message },
        );
      });
    throw new BadRequestError(
      "Payment signature verification failed",
      "INVALID_SIGNATURE",
    );
  }

  await prisma.paymentOrder.update({
    where: { id: paymentOrderId },
    data: {
      status: "CAPTURED",
      gatewayPaymentId,
      gatewaySignature,
      version: { increment: 1 },
    },
  });

  await prisma.paymentAuditLog.create({
    data: {
      paymentOrderId: paymentOrder.id,
      action: "PAYMENT_CAPTURED_VIA_VERIFY",
      metadata: { gatewayPaymentId },
    },
  });

  logger.info(`Payment captured via verify : ${paymentOrder.id}`);

  await paymentProducer
    .publishPaymentSuccess(
      paymentOrder.id,
      paymentOrder.bookingId,
      gatewayPaymentId,
      paymentOrder.amount,
    )
    .catch((err) => {
      logger.error("Failed to publish PAYMENT_SUCCESS after verify", {
        error: err.message,
      });
    });

  return {
    paymentOrderId: paymentOrder.id,
    status: "CAPTURED",
    gatewayPaymentId,
  };
};

const handleWebhook = async (rawBody, signature) => {
  const gateway = getGateway();

  //verify the signature
  const isValid = gateway.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    logger.warn("Webhook signature verification failed");
    throw new BadRequestError("Invalid Webhook signature", "INVALID_SIGNATURE");
  }
  const payload =
    typeof rawBody === "string"
      ? JSON.parse(rawBody)
      : JSON.parse(rawBody.toString("utf-8"));

  const event = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;

  if (!paymentEntity) {
    logger.warn("Webhook payload missing payment entity", { event });
    return { status: "ignored", event };
  }

  const gatewayOrderId = paymentEntity.order_id;
  const gatewayPaymentId = paymentEntity.id;

  const paymentOrder = await prisma.paymentOrder.findUnique({
    where: { gatewayOrderId },
  });

  if (!paymentOrder) {
    logger.warn(`Payment order not found for gateway order ${gatewayOrderId}`);
    return { status: "ignored", reason: "order_not_found" };
  }

  await prisma.paymentAuditLog.create({
    data: {
      paymentOrderId: paymentOrder.id,
      action: `WEBHOOK_${event.toUpperCase()}`,
      gatewayResponse: payload,
    },
  });

  if (event === "payment.captured" || event === "payment_authorized") {
    return handlePaymentCaptured(paymentOrder, gatewayPaymentId, paymentEntity);
  }
  if (event === "payment.failed") {
    return handlePaymentFailed(paymentOrder, gatewayPaymentId, paymentEntity);
  }
  if (event === "refund.processed" || event === "refund.created") {
  }
};

const handlePaymentCaptured = async (
  paymentOrder,
  gatewayPaymentId,
  paymentEntity,
) => {
  if (paymentOrder.status === "CAPTURED") {
    logger.info(`Payment already captured: ${paymentOrder.id}`);
    return { status: "already_processed" };
  }

  if (paymentOrder.status !== "CREATED") {
    logger.warn(`Cannot capture payment in status: ${paymentOrder.status}`, {
      paymentOrderId: paymentOrder.id,
    });
    return { status: "invalid_state", currentStatus: paymentOrder.status };
  }

  await prisma.paymentOrder.update({
    where: { id: paymentOrder.id },
    data: {
      status: "CAPTURED",
      gatewayPaymentId,
      gatewaySignature: paymentEntity.acquirer_data?.auth_code || null,
      version: { increment: 1 },
    },
  });

  logger.info(`Payment captured: ${paymentOrder.id}`, {
    gatewayProvider: paymentOrder.gatewayProvider,
  });

  //Publish event to kafka
  await paymentProducer
    .publishPaymentSuccess(
      paymentOrder.id,
      paymentOrder.bookingId,
      gatewayPaymentId,
      paymentOrder.amount,
    )
    .catch((err) => {
      logger.error("Failed to publish PAYMENT_SUCCESS", { error: err.message });
    });

  return { status: "captured", paymentOrderId: paymentOrder.id };
};

const handlePaymentFailed = async (
  paymentOrder,
  gatewayPaymentId,
  paymentEntity,
) => {
  if (paymentOrder.status === "FAILED") {
    return { status: "already_processed" };
  }

  if (paymentOrder.status !== "CREATED") {
    return { status: "invalid_state", currentStatus: paymentOrder.status };
  }

  const reason =
    paymentEntity.error_description ||
    paymentEntity.error_reason ||
    "payment_failed";

  await prisma.paymentOrder.update({
    where: { id: paymentOrder.id },
    data: {
      status: "FAILED",
      gatewayPaymentId,
      failureReason: reason,
      version: { increment: 1 },
    },
  });
  logger.info(`Payment failed: ${paymentOrder.id}`, { reason });

  // Publish PAYMENT_FAILED to Kafka
  await paymentProducer
    .publishPaymentFailed(paymentOrder.id, paymentOrder.bookingId, reason)
    .catch((err) => {
      logger.error("Failed to publish PAYMENT_FAILED", { error: err.message });
    });

  return { status: "failed", paymentOrderId: paymentOrder.id };
};
