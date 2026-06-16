const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  ipRateLimit,
  endpointRateLimit,
  combinedRateLimit,
} = require("../middleware/rateLimiting.middleware");

const {
  createProxy,
  CircuitBreaker,
  circuitBreakers,
  getCircuitBreakerStatus,
} = require("../services/proxy");

const { config } = require("../config");
const router = express.Router();

const userServiceProxy = createProxy(
  "userService",
  config.SERVICES.USER_SERVICE_URL,
);
router.post(
  "/users/auth/login",
  endpointRateLimit(100, 900000), //100 reqs per 15 minutes
  userServiceProxy,
);
router.get(
  "/users/user/profile",
  requireAuth,
  combinedRateLimit(),
  userServiceProxy,
);
router.get("/gateway/heath", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is healthy",
    timestamp: new Date().toString(),
  });
});

module.exports = router;
