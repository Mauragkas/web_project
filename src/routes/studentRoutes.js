const express = require("express");
const path = require("path");
const { authMiddleware } = require("../middleware/authMiddleware");
const studentController = require("../controllers/studentController");

const router = express.Router();

router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/student/dashboard.html"));
});

// --- API endpoint for dashboard data ---
router.get(
  "/api/student/dashboard",
  authMiddleware("student"),
  studentController.getDashboardData,
);

module.exports = router;
