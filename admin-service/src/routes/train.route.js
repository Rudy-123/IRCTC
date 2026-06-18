const express = require("express");
const router = express.Router();
const { createTrain } = require("../controllers/train.controller");
const { getUserContext } = require("../middlewares/getUserContext");

router.post("/train", getUserContext, createTrain);

module.exports = router;
