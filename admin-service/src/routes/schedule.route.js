const express = require("express");
const router = express.Router();
const { getUserContext } = require("../middlewares/getUserContext");
const { createSchedule } = require("../controllers/schedule.controller");

router.post("/schedule", getUserContext, createSchedule);

module.exports = router;
