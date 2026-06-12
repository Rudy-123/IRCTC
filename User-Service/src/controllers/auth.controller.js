//main logic of this is to check for the incoming request and check the necessary conditions
//then wait for the optsession id generation from the auth.service.js

const { BadRequestError, UnauthorizedError } = require("../utils/error");
const asyncHandler = require("../utils/asyncHandler");
const { config } = require("../config");
const authService = require("../services/auth.service");
const { getDeviceFingerprint } = require("../middlewares/auth.middleware");

exports.sendOTP = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    throw new BadRequestError("All Field are mandatory");
  }
  if (password !== confirmPassword) {
    throw new BadRequestError("Password Mismatched");
  }
  const { otpSessionId } = await authService.sendOTP(
    firstName,
    lastName,
    email,
    password,
  );
  res
    .cookie("otp_session", otpSessionId, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: config.OTP_TTL * 1000,
    })
    .status(200)
    .json({
      success: true,
      message: "OTP sent successfully",
    });
});
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const otpSessionId = req.cookies.otp_session;
  if (!otp || !otpSessionId) {
    throw new BadRequestError("Otp or Otpsession is missing");
  }
  const user = await authService.verifyOTPService(otp, otpSessionId);
  return res.status(201).json({
    success: true,
    message: "User Account created Successfully",
    data: user,
  });
});
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError("Email and Password are required");
  }
  const deviceId = getDeviceFingerprint(req);
  const { accessToken, refreshToken, loggedInUser } = await authService.login(
    email,
    password,
    deviceId,
  );
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: config.ACCESS_TOKEN_EXP_SEC * 1000,
  });
  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: config.REFRESH_TOKEN_EXP_SEC * 1000,
    })
    .status(200)
    .json({
      success: true,
      message: "Logged In Successfully",
      loggedInUser,
    });
});

//generates a new pair of access and refresh token
exports.rotateRefreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new UnauthorizedError("refresh Token is missing", "LOGIN AGAIN");
  }
  const deviceId = getDeviceFingerprint(req);
  const { newAccessToken, newRefreshToken } =
    await authService.rotateRefreshToken(refreshToken, deviceId);
  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: config.ACCESS_TOKEN_EXP_SEC * 1000,
  });
  res
    .cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: config.REFRESH_TOKEN_EXP_SEC * 1000,
    })
    .status(200)
    .json({
      success: true,
      message: "Access Token and Refresh Token reissued",
    });
});

//verify the google id token received from the frontend
//token was issued by google, sent to frontend and then forwarded to backend through axios.post
exports.verifyGoogleIdToken = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    throw new BadRequestError("Invalid Google ID Token", "INVALID TOKEN");
  }
  //if the token is there and correct then return the user
  const deviceId = getDeviceFingerprint(req);
  const { accessToken, refreshToken, loggedInUser } =
    await authService.verifyGoogleIdToken(idToken, deviceId);
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: config.ACCESS_TOKEN_EXP_SEC * 1000,
  });
  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: config.REFRESH_TOKEN_EXP_SEC * 1000,
    })
    .status(200)
    .json({
      success: true,
      message: "Logged In Successfully",
    });
});
