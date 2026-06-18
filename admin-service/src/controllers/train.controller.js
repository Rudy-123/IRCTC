const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../utils/error");
const trainService = require("../services/train.service");

exports.createTrain = asyncHandler(async (req, res) => {
  const { trainNumber, trainName, coachName, seats } = req.body;
  if (!trainName || !trainNumber || !coachName || !seats) {
    throw new BadRequestError("TrainNumber,TrainName and seats are required");
  }
  if (seats.length === 0) {
    throw new BadRequestError("Atleast 1 seat must be defined");
  }
  const train = await trainService.createTrain({
    trainNumber,
    trainName,
    coachName,
    seats,
  });
  return res.status(201).json({
    success: true,
    message: "Train Added Successfully",
    data: train,
  });
});
