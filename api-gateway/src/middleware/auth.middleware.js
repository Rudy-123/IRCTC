const jwt = require("jsonwebtoken");
const { config } = require("../config");
const { UnauthorizedError } = require("../utils/error");
const logger = require("../config/logger");

//middleware to verify access token from auth header, if authenticated then fetch userid and pass it to the next microservice
function requireAuth(req, res, next) {
  try {
    let accessToken;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }
    if (!accessToken && req.cookies) {
      //if token not got in header then watch in cookies
      accessToken = req.cookies.accessToken;
    }
    if (!accessToken) {
      throw new UnauthorizedError("Authorization token missing");
    }
    const payload = jwt.verify(accessToken, config.JWT_ACCESS_SECRET);
    if (!payload.id) {
      throw new UnauthorizedError("Invalid token payload");
    }
    //attach user for the further services
    req.user = {
      //req object add the user
      id: payload.id,
    };
    req.headers["x-user-id"] = payload.id.toString();
    logger.debug(`User ${payload.id} authenticated successfully`);

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(
        new UnauthorizedError("Access token expired", "TOKEN_EXPIRED"),
      );
    }
    if (err.name === "JsonWebTokenError") {
      return next(
        new UnauthorizedError("Invalid access token", "TOKEN_INVALID"),
      );
    }
    return next(err);
  }
}
module.exports = { requireAuth };
