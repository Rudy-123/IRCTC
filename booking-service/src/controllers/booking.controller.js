exports.createBooking = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    scheduleId,
    seatsIds,
    passangers,
    idempotencyKey,
    fromStationId,
    toStationId,
    fromSeq,
    toSeq,
  } = req.body;

  if (!scheduleId || !seatsIds || !passangers || !idempotencyKey) {
    throw new BadRequestError(
      `scheduleId,seatsIds,passangers, and idempotencyKey are required`,
    );
  }
  const result = await bookingService.createBooking(
    userId,
    scheduleId,
    seatsIds,
    passangers,
    idempotencyKey,
    fromStationId,
    toStationId,
    fromSeq,
    toSeq,
  );

  return res.status(201).json({
    success: true,
    data: result,
  });
});
