const express = require("express");
const path = require("path");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
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

// API endpoint for thesis details
router.get(
  "/api/secretariat/thesis/:thesisId/details",
  authMiddleware("secretariat"),
  secretariatController.getThesisDetails,
);

// Data Import API
router.post(
  "/api/secretariat/data-import",
  authMiddleware("secretariat"),
  upload.single("dataFile"),
  secretariatController.importUserData,
);

module.exports = router;
