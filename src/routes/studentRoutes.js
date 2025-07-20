const express = require("express");
const multer = require("multer");
const path = require("path");
const { authMiddleware } = require("../middleware/authMiddleware");
const studentController = require("../controllers/studentController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/uploads/thesis_drafts"));
  },
  filename: function (req, file, cb) {
    // Use thesisId + timestamp for uniqueness
    const ext = path.extname(file.originalname);
    cb(null, `thesis_${req.body.thesisId || "unknown"}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only PDFs
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed!"));
  },
});

router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/student/dashboard.html"));
});

// --- API endpoint for dashboard data ---
router.get(
  "/api/student/dashboard",
  authMiddleware("student"),
  studentController.getDashboardData,
);

// API: Search instructors for committee selection
router.get(
  "/api/student/committee/instructors",
  authMiddleware("student"),
  studentController.searchInstructors,
);

// API: Invite committee members
router.post(
  "/api/student/committee/invite",
  authMiddleware("student"),
  studentController.inviteCommitteeMembers,
);

router.post(
  "/api/student/profile",
  authMiddleware("student"),
  studentController.updateProfile,
);

// API: Upload thesis draft and supporting material
router.post(
  "/api/student/thesis/materials",
  authMiddleware("student"),
  upload.single("draftFile"),
  studentController.uploadMaterials,
);

// API: Get presentation details for thesis
router.get(
  "/api/student/thesis/:thesisId/presentation-details",
  authMiddleware("student"),
  studentController.getPresentationDetails,
);

// API: Submit presentation details
router.post(
  "/api/student/thesis/:thesisId/presentation",
  authMiddleware("student"),
  studentController.submitPresentationDetails,
);

// API: Get examination report (HTML)
router.get(
  "/api/student/thesis/:thesisId/report",
  authMiddleware("student"),
  studentController.getExaminationReport,
);

// API: Record library repository link (Nemertis)
router.post(
  "/api/student/thesis/:thesisId/repository-link",
  authMiddleware("student"),
  studentController.recordRepositoryLink,
);

router.get(
  "/api/student/thesis/:thesisId/completed-details",
  authMiddleware("student"),
  studentController.getCompletedThesisDetails,
);

module.exports = router;
