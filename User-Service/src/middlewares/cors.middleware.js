const cors = require("cors"); //ready made package to handle cors
const { config } = require("../config");

const allowedOrigins = config.ALLOWED_ORIGINS //takes the values from the .env files so allowed origins is the list of links
  ? config.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
module.exports = { corsMiddleware };
