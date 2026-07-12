const prisma = require("../config/prisma");
const logger = require("../config/logger");
const { config } = require("../config");
const {
  inventoryClient,
  extractError: extractInventoryError,
} = require("./inventoryClient");
const {
  paymentClient,
  extractError: extractPaymentError,
} = require("./paymentClient");
const { userClient } = require("./userClient");
const { stationClient } = require("./stationClient");
const {
  acquireSeatLocks,
  releaseSeatLocks,
  forceReleaseSeatLocks,
} = require("../utils/distributedLock");
const saga = require("./saga.service");
const bookingProducer = require("../kafka/producer/booking.producer");
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
  StaleStateError,
} = require("../utils/error");

const checkIdempotency = async (key) => {
  const existing = prisma.idempotencyRecord.findUnique({
    where: { eventKey: key },
  });
  if (existing) {
    logger.info(`Idempotent request: ${key}`);
    return existing.response;
  }
  return null;
};

const saveIdempotency = async (key, response) => {
  await prisma.idempotencyRecord.create({
    data: { eventKey: key, response },
  });
};

const createBooking = async (
  userId,
  scheduleId,
  seatsIds,
  passengers,
  idempotencyKey,
  fromStationId,
  toStationId,
  fromSeq,
  toSeq,
) => {
  if (
    !scheduleId ||
    !seatsIds ||
    !Array.isArray(seatsIds) ||
    seatsIds.length === 0
  ) {
    throw new BadRequestError(`SchueduleId and seatIds are required`);
  }

  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    throw new BadRequestError(`Passengers is required`);
  }

  if (!idempotencyKey) {
    throw new BadRequestError("Idempotency Key is required");
  }

  if (fromSeq && toSeq && fromSeq >= toSeq) {
    throw new BadRequestError(
      "fromStation should come before toStation in route",
    );
  }

  const cached = await checkIdempotency(`booking:${idempotencyKey}`);

  if (cached) {
    return cached;
  }

  const availability = await inventoryClient.getAvailability(scheduleId);
  if (availability.status !== "ACTIVE") {
    throw new BadRequestError("Schedule is not active");
  }
  if (new Date(availability.departureDate) < new Date()) {
    throw new BadRequestError("Cannot book a train that has already departed");
  }
  const seatData = await inventoryClient.getSeats(scheduleId, {
    fromSeq: fromSeq || undefined,
    toSeq: toSeq || undefined,
  });

  const seatMap = new Map(seatData.seats.map((s) => [s.seatId, s]));
  const bookingSeats = [];
  let totalAmount = 0;
  for (const seatId of seatsIds) {
    const seat = seatMap.get(seatId);
    if (!seat) {
      throw new NotFoundError(`Seat ${seatId} not found in schedule`);
    }

    const isAvailable =
      fromSeq && toSeq && seat.segmentStatus !== undefined
        ? //means the seat is for partial booking not from source to destination
          seat.segmentStatus === "AVAILABLE"
        : seat.status === "AVAILABLE";
    if (!isAvailable) {
      throw new ConflictError(
        `Seat ${seat.seatNumber} is not available for this segment`,
        "SEATS_UNAVAILABLE",
      );
    }

    bookingSeats.push(seat);
    totalAmount += seat.price;
  }

  const sortedSeatIds = [...seatIds].sort();
  const { acquired, lockValue } = await acquireSeatLocks(
    scheduleId,
    sortedSeatIds,
    `pre-${Date.now()}`,
    config.BOOKING_TTL_SECONDS,
    fromSeq,
    toSeq,
  );

  if (!acquired) {
    throw new ConflictError(
      `One or more seats are being booked by other user. Please try again`,
      "SEATS LOCKED",
    );
  }

  let booking;
  try {
    const lockExpiresAt = new Date(
      Date.now() + config.BOOKING_TTL_SECONDS * 1000,
    );
    booking = await prisma.booking.create({
      data: {
        userId,
        scheduleId,
        trainId: availability.trainId,
        trainNumber: availability.trainNumber,
        trainName: availability.trainName,
        departureDate: new Date(availability.departureDate),
        status: "PENDING",
        totalAmount,
        seatCount: seatIds.length,
        fromStationId: fromStationId || null, // --- SEGMENT BOOKING
        toStationId: toStationId || null, // --- SEGMENT BOOKING
        fromSeq: fromSeq || null, // --- SEGMENT BOOKING
        toSeq: toSeq || null, // --- SEGMENT BOOKING
        idempotencyKey,
        lockExpiresAt,
        seats: {
          create: bookingSeats.map((seat, index) => ({
            seatId: seat.seatId,
            seatNumber: seat.seatNumber,
            seatType: seat.seatType,
            price: seat.price,
          })),
        },
        passengers: {
          create: passengers.map((p, index) => ({
            name: p.name,
            age: p.age,
            gender: p.gender,
            seatId: seatIds[index] || null, // use original order to match user's intended seat assignment
          })),
        },
      },
      include: { seats: true, passengers: true },
    });

    //SAGA STEPS EXECUTION, hold seats in inventory
    await saga.executeHoldSeats(
      booking,
      sortedSeatIds,
      config.LOCK_TTL_SECONDS,
      fromSeq,
      toSeq,
    );

    //Create the payment order
    const paymentOrder = await saga.executeCreatePayment(booking);

    booking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { seats: true, passengers: true },
    });

    const response = {
      bookingId: booking.id,
      status: booking.status,
      totalAmount: booking.totalAmount,
      lockExpiresAt: booking.lockExpiresAt,
      seats: booking.seats.map((s) => ({
        seatId: s.seatId,
        seatNumber: s.seatNumber,
        seatType: s.seatType,
        price: s.price,
      })),
      passengers: booking.passengers.map((p) => ({
        name: p.name,
        age: p.age,
        gender: p.gender,
      })),
      paymentOrder: {
        paymentOrderId: paymentOrder.paymentOrderId,
        gatewayOrderId: paymentOrder.gatewayOrderId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        keyId: paymentOrder.keyId,
      },
    };

    await saveIdempotency(`booking:${idempotencyKey}`, response);

    return response;
  } catch (err) {
    //compensate on failure
    logger.error(`Booking creation for the user ${userId}`, {
      err: err.message,
    });
    if (booking) {
      await saga.compensateAll(booking, sortedSeatIds);
      await prisma.booking.update({
        where: { id: booking.id },

        data: {
          status: "FAILED",
          failureReason: err.response?.data?.message || err.message,
        },
      });
      //release redis locks
      await releaseSeatLocks(
        scheduleId,
        sortedSeatIds,
        lockValue,
        fromSeq,
        toSeq,
      );
      throw err;
    }

    throw err;
  }
};
