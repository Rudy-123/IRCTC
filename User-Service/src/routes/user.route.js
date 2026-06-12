const express = require("express");
const { isAuthenticated } = require("../middlewares/auth.middleware");
const { getProfile } = require("../controllers/user.controller");

const router = express.Router();
router.get("/get-profile", isAuthenticated, getProfile);
module.exports = router;
