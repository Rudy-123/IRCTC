const express = require("express");
const router = express.Router();
const {
  createTrain,
  createRoute,
  getTrainById,
} = require("../controllers/train.controller");
const { getUserContext } = require("../middlewares/getUserContext");

router.post("/train", getUserContext, createTrain);
router.post("/route", getUserContext, createRoute);
router.get("/train/:trainId", getUserContext, getTrainById);

module.exports = router;
