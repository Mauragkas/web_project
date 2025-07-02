const express = require("express");
const path = require("path");
const { authMiddleware } = require("../middleware/authMiddleware");
const secretariatController = require("../controllers/secretariatController");

const router = express.Router();

// dashboard route
router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/secretariat/dashboard.html"));
});

// API endpoint for active and under examination theses
router.get(
  "/api/secretariat/theses/active-under-exam",
  authMiddleware("secretariat"),
  secretariatController.getActiveAndUnderExaminationTheses,
);

module.exports = router;
