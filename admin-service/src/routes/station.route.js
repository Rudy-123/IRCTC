const express = require("express");
const { getUserContext } = require("../middlewares/getUserContext");
const { createStation } = require("../controllers/station.controller");
const { create } = require("node:domain");

const router = express.Router();

router.post("/station", getUserContext, createStation);

module.exports = router;
