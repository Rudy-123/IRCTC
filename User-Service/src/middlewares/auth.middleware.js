const crypto = require("crypto");
const { UnauthorizedError } = require("../utils/error");
const { verifyAccessToken } = require("../utils/auth");
const asyncHandler = require("../utils/asyncHandler");

function getDeviceFingerprint(req) {
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.ip || "";
  const accept = req.headers["accept"] || "";

  const raw = `${userAgent}|${ip}|${accept}`;

  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16); // short device id
}

// Light Auth Middleware (Sirf token check karega aur userId nikalega)
const isAuthenticated = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new UnauthorizedError("Access token missing", "LOGIN_REQUIRED");
  }

  const decoded = verifyAccessToken(token); //verification of the access token
  req.user = { id: decoded.id }; // sirf ID attach kardi
  next();
});

module.exports = { getDeviceFingerprint, isAuthenticated };
