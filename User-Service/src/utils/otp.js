const { TooManyRequestsError } = require("./error");
const { redis } = require("../config/redis");
const { config } = require("../config");
const RATE_MAX = parseInt(config.OTP_RATE_MAX_PER_HOUR || "5", 10);
const ATTEMPT_MAX = parseInt(config.OTP_MAX_VERIFY_ATTEMPTS || "5", 10);
const otpGenerator = require("otp-generator");
const OTP_TTL = parseInt(config.OTP_TTL || "300", 10);
const HMAC_SECRET = config.HMAC_SECRET;
const crypto = require("crypto");

function hmacFor(email, otp) {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(email + ":" + otp)
    .digest("hex");
}

async function generateAndStoreOtp(meta) {
  //generate the otp and store the otp in redis
  //1 hr me 1 single user max 5 opt's generate kr sakta h then too many requests
  const ratekey = `otp:rate:${meta.email}`;
  const sentCount = parseInt((await redis.get(ratekey)) || "0", 10);
  if (sentCount > 5) {
    throw new TooManyRequestsError(
      "Too many otp requests. Try again later",
      "OTP_RATE_LIMIT",
    );
  }
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  const otpSessionId = crypto.randomUUID();
  const hashed = hmacFor(meta.email, otp);
  await redis.set(
    `otp:session:${otpSessionId}`,
    JSON.stringify({
      hashedOtp: hashed,
      meta,
    }),
    "EX",
    OTP_TTL,
  );
  await redis.incr(ratekey);
  await redis.expire(ratekey, 3600);
  return { otp, otpSessionId };
}
async function verifyOTP(otp, otpSessionId) {
  otp = String(otp).trim();
  const rawData = await redis.get(`otp:session:${otpSessionId}`);
  if (!rawData) {
    return null;
  }
  const { hashedOtp: storedOtp, meta } = JSON.parse(rawData);
  const attemptsKey = `otp:attempts:${meta.email}`;
  const attemptsCount = parseInt((await redis.get(attemptsKey)) || "0", 10);
  if (attemptsCount >= ATTEMPT_MAX) {
    throw new TooManyRequestsError("Too many attempts to verify the otp");
  }
  const hashedOtp = hmacFor(meta.email, otp);
  if (
    crypto.timingSafeEqual(
      Buffer.from(hashedOtp, "hex"),
      Buffer.from(storedOtp, "hex"),
    )
  ) {
    await redis.del(`otp:session:${otpSessionId}`, attemptsKey);
    await redis.del(`otp:rate:${meta.email}`);
    return meta;
  } else {
    await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, config.OTP_TTL);
    return null;
  }
}
module.exports = { generateAndStoreOtp, verifyOTP };
