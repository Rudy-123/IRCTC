const express = require("express");
const { isAuthenticated } = require("../middlewares/auth.middleware");
const {
  getProfile,
  updateProfile,
  deletProfile,
} = require("../controllers/user.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.get("/profile", requireAuth, deleteProfile);
module.exports = router;
