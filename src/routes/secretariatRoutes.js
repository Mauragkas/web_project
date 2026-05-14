const express = require("express");
const path = require("path");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { authMiddleware } = require("../middleware/authMiddleware");
const secretariatController = require("../controllers/secretariatController");

const router = express.Router();

// dashboard route
router.get("/dashboard", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../public/views/secretariat/dashboard.html"),
  );
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

// API endpoint to record AP number
router.post(
  "/api/secretariat/thesis/:thesisId/record-ap-number",
  authMiddleware("secretariat"),
  secretariatController.recordApNumber,
);

// API endpoint to cancel thesis assignment
router.post(
  "/api/secretariat/thesis/:thesisId/cancel-assignment",
  authMiddleware("secretariat"),
  secretariatController.cancelThesisAssignment,
);

// API endpoint to check if thesis is ready for completion
router.get(
  "/api/secretariat/thesis/:thesisId/completion-check",
  authMiddleware("secretariat"),
  secretariatController.checkCompletionReadiness,
);

// API endpoint to mark thesis as completed
router.post(
  "/api/secretariat/thesis/:thesisId/complete",
  authMiddleware("secretariat"),
  secretariatController.completeThesis,
);

module.exports = router;
