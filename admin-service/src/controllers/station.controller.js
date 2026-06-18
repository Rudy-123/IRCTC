const { BadRequestError } = require("../utils/error");
const asyncHandler = require("../utils/asyncHandler");
const stationService = require("../services/station.service");

exports.createStation = asyncHandler(async (req, res) => {
  const { name, code, city, state } = req.body;

  if (!name || !code || !city || !state) {
    throw new BadRequestError(
      "StationName, StationCode, StationCity, StationState are required",
    );
  }

  // Note: Ensure stationService is required at the top if you use it here.
  // Assuming it's imported globally or will be added soon.
  const station = await stationService.createStation({
    code: code.toUpperCase(),
    name,
    city,
    state,
  });

  return res.status(201).json({
    success: true,
    message: "Station Created Successfully",
  });
});
