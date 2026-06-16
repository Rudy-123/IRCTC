const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError } = require("../utils/error");
const userService = require("../services/user.service");
const prisma = require("../config/prisma");
const { redis } = require("../config/redis");
const logger = require("../config/logger");

exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    throw new BadRequestError("User Id is missing");
  }
  const user = await userService.getProfile(userId);
  return res.status(200).json({
    success: true,
    message: "Fetched User Details",
    data: {
      user,
    },
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    throw new BadRequestError("User Id is missing");
  }

  const { firstName, lastName } = req.body;
  if (!firstName && !lastName) {
    throw new BadRequestError(
      "Provide at least firstName or lastName to update",
    );
  }
  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  await redis.del(`user:${userId}`);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    throw new BadRequestError("User Id is missing");
  }
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!existingUser) {
    throw new NotFoundError("User Not Found");
  }
  await prisma.user.delete({
    where: { id: userId },
  });
  await redis.del(`user:${userId}`);
  logger.info(`Profile deleted for user: ${userId}`);
  return res.status(200).json({
    success: true,
    message: "Profile deleted successfully",
    data: null,
  });
});

exports.getUserInternal = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new BadRequestError("User Id is missing");
  }

  const user = await userService.getProfile(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });
});
