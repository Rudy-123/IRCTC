//it is responsible for generation of otp and optsessionid as well that's passes in the cookie
const {
  ConflictError,
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} = require("../utils/error");
const { generateAndStoreOtp, verifyOTP } = require("../utils/otp");
const { sendOTPEmail, verifyOtpEmail } = require("../utils/email");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/auth");
const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { config } = require("../config");
const logger = require("../config/logger");
const jwt = require("jsonwebtoken");
const { redis } = require("../config/redis");
const { generate } = require("otp-generator");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);
const notificationProducer = require("../kafka/producer/notification.producer");

const sendOTP = async (firstName, lastName, email, password) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new ConflictError("User Already Exists");
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const meta = { firstName, lastName, email, hashedPassword };
  const { otp, otpSessionId } = await generateAndStoreOtp(meta);
  await notificationProducer.sendOTPEmail(email, otp, config.OTP_TTL / 60);
  logger.info(`OTP Email queued for: ${email}`);
  return { otpSessionId };
};

const verifyOTPService = async (otp, otpSessionId) => {
  const meta = await verifyOTP(otp, otpSessionId);
  if (meta === null) {
    throw new BadRequestError("Invalid or Expired Otp", "OTP_INVALID");
  }
  const user = await prisma.user.create({
    data: {
      firstName: meta.firstName,
      lastName: meta.lastName,
      email: meta.email,
      password: meta.hashedPassword,
      emailVerified: true,
    },
  });
  await notificationProducer.sendWelcomeEmail(meta.email, meta.firstName);
  return user;
};

const login = async (email, password, deviceId) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (!existingUser) {
    throw new BadRequestError("Email Not Found");
  }
  const doesPasswordMatch = await bcrypt.compare(
    password,
    existingUser.password,
  );
  if (!doesPasswordMatch) {
    throw new BadRequestError("Incorrect Password");
  }
  const accessToken = generateAccessToken(existingUser.id);
  const refreshToken = generateRefreshToken(existingUser.id);
  const { jti } = jwt.decode(refreshToken);
  await redis.set(
    `refresh:${existingUser.id}:${deviceId}`,
    jti,
    "EX",
    config.REFRESH_TOKEN_EXP_SEC,
  );
  const { password: _password, ...safeUser } = existingUser;
  await redis.set(
    `user:${existingUser.id}`,
    JSON.stringify(safeUser),
    "EX",
    config.REDIS_USER_TTL,
  );
  return { accessToken, refreshToken, loggedInUser: safeUser };
};

const rotateRefreshToken = async (refreshToken, deviceId) => {
  const payload = verifyRefreshToken(refreshToken);
  const { id: userId, jti } = payload;
  const storedjti = await redis.get(`refresh:${userId}:${deviceId}`);
  if (!storedjti) {
    throw new ForbiddenError("Session Expired", "Login Again");
  }
  if (storedjti !== jti) {
    await redis.del(`refresh:${userId}:${deviceId}`);
    throw new ForbiddenError("Refresh token reused", "Login Again");
  }
  const newAccessToken = generateAccessToken(payload.id);
  const newRefreshToken = generateRefreshToken(payload.id);
  const { jti: newjti } = jwt.decode(newRefreshToken);
  await redis.set(
    `refresh:${payload.id}:${deviceId}`,
    newjti,
    "EX",
    config.REFRESH_TOKEN_EXP_SEC,
  );
  return { newAccessToken, newRefreshToken };
};

const verifyGoogleIdToken = async (idToken, deviceId) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload.sub || !payload.email) {
    throw new UnauthorizedError("Invalid Google Token Payload");
  }
  const googleUser = {
    provider: payload.iss,
    providerId: payload.sub,
    email: payload.email,
    firstName: payload.given_name,
    lastName: payload.family_name,
    emailVerified: payload.email_verified || false,
  };
  const user = await prisma.$transaction(async (tx) => {
    let googleAuth = await tx.authProvider.findUnique({
      where: {
        provider_providerId: {
          provider: googleUser.provider,
          providerId: googleUser.providerId,
        },
      },
      include: { user: true },
    });
    if (googleAuth) {
      return googleAuth.user;
    }
    let existingUser = await tx.user.findUnique({
      where: {
        email: googleUser.email,
      },
    });
    if (existingUser) {
      await tx.authProvider.create({
        data: {
          provider: googleUser.provider,
          providerId: googleUser.providerId,
          userId: existingUser.id,
        },
      });
      return existingUser;
    }
    //if not in auth provider and not in user table so create new and dono tables me entry
    return await tx.user.create({
      data: {
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        emailVerified: googleUser.emailVerified,
        AuthProviders: {
          create: {
            provider: googleUser.provider,
            providerId: googleUser.providerId,
          },
        },
      },
    });
  });
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  const { jti } = jwt.decode(refreshToken);
  await redis.set(
    `refresh:${user.id}:${deviceId}`,
    jti,
    "EX",
    config.REFRESH_TOKEN_EXP_SEC,
  );
  const { password: _password, ...safeUser } = user;
  await redis.set(
    `user:${user.id}`,
    JSON.stringify(safeUser),
    "EX",
    config.REDIS_USER_TTL,
  );
  return { accessToken, refreshToken, loggedInUser: safeUser };
};
module.exports = {
  sendOTP,
  verifyOTPService,
  login,
  rotateRefreshToken,
  verifyGoogleIdToken,
};
