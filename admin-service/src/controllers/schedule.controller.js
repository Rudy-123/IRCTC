const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../utils/error");
const { createTrain } = require("./train.controller");
const scheduleService = require("../services/schedule.service");

exports.createSchedule = asyncHandler(async (req, res) => {
  const { trainId, departureDate } = req.body;
  if (!trainId || !departureDate) {
    throw new BadRequestError("Train Id and Departure date are required");
  }
  const schedule = await scheduleService.createSchedule({
    trainId,
    departureDate,
  });
  return res.status(201).json({
    success: true,
    message: "Train Schedule created successfully",
    data: schedule,
  });
});
