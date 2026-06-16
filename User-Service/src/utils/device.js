const crypto = require("crypto");

/**
 * Generates a basic device fingerprint based on User-Agent and IP Address.
 */
function getDeviceFingerprint(req) {
  const userAgent = req.headers["user-agent"] || "unknown-agent";
  const ip = req.ip || req.connection.remoteAddress || "unknown-ip";

  // Combine and hash to create a stable fingerprint
  return crypto.createHash("sha256").update(`${userAgent}-${ip}`).digest("hex");
}

module.exports = { getDeviceFingerprint };
