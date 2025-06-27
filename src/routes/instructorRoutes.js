const express = require("express");
const path = require("path");
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const instructorController = require("../controllers/instructorController");

const router = express.Router();

// Multer setup for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/uploads/topics"));
  },
  filename: function (req, file, cb) {
    // Use timestamp + original name for uniqueness
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + file.fieldname + ext);
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

// Serve dashboard and topics page
router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/instructor/dashboard.html"));
});
router.get("/topics", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/instructor/topics.html"));
});

// API: Create thesis topic
router.post(
  "/api/instructor/topics/create",
  authMiddleware("instructor"),
  upload.single("document"),
  instructorController.createTopic,
);

// Get topic details for editing
router.get(
  "/api/instructor/topics/:topicId/edit",
  authMiddleware("instructor"),
  instructorController.getTopicDetailsForEdit,
);

// Update topic (with optional file upload)
router.post(
  "/api/instructor/topics/:topicId/update",
  authMiddleware("instructor"),
  upload.single("document"),
  instructorController.updateTopic,
);

router.get(
  "/api/instructor/topics",
  authMiddleware("instructor"),
  instructorController.getMyTopics,
);

// API: Delete topic
router.delete(
  "/api/instructor/topics/:topicId/delete",
  authMiddleware("instructor"),
  instructorController.deleteTopic,
);

// API: Get available topics
router.get(
  "/api/instructor/available-topics",
  authMiddleware("instructor"),
  instructorController.getAvailableTopics,
);

// API: Search for students
router.get(
  "/api/instructor/student-search",
  authMiddleware("instructor"),
  instructorController.searchStudent,
);

// API: Assign topic to student
router.post(
  "/api/instructor/assign-topic",
  authMiddleware("instructor"),
  instructorController.assignTopicToStudent,
);

// API: Get current assignments
router.get(
  "/api/instructor/current-assignments",
  authMiddleware("instructor"),
  instructorController.getCurrentAssignments,
);

// API: Cancel assignment
router.post(
  "/api/instructor/cancel-assignment/:assignmentId",
  authMiddleware("instructor"),
  instructorController.cancelAssignment,
);

// API: Get all theses for instructor (with filters)
router.get(
  "/api/instructor/theses",
  authMiddleware("instructor"),
  instructorController.getThesesList,
);

router.get(
  "/api/instructor/theses/:thesisId/details",
  authMiddleware("instructor"),
  instructorController.getThesisDetails,
);

// API: Get committee invitations
router.get(
  "/api/instructor/committee-invitations",
  authMiddleware("instructor"),
  instructorController.getCommitteeInvitations,
);

// API: Respond to invitation (accept/reject)
router.post(
  "/api/instructor/committee-invitations/:invitationId/respond",
  authMiddleware("instructor"),
  instructorController.respondToCommitteeInvitation,
);

// API: Get instructor statistics
router.get(
  "/api/instructor/statistics",
  authMiddleware("instructor"),
  instructorController.getInstructorStatistics,
);

// Add thesis note (POST)
router.post(
  "/api/instructor/theses/:thesisId/notes",
  authMiddleware("instructor"),
  instructorController.addThesisNote,
);

// Get thesis notes (GET)
router.get(
  "/api/instructor/theses/:thesisId/notes",
  authMiddleware("instructor"),
  instructorController.getThesisNotes,
);

// API: Cancel active thesis
router.post(
  "/api/instructor/theses/:thesisId/cancel-active",
  authMiddleware("instructor"),
  instructorController.cancelActiveThesis,
);

// API: Change status to Under Examination
router.post(
  "/api/instructor/theses/:thesisId/change-status-under-examination",
  authMiddleware("instructor"),
  instructorController.changeStatusToUnderExamination,
);

router.get(
  "/api/instructor/theses/:thesisId/announcement-text",
  authMiddleware("instructor"),
  instructorController.generateAnnouncementText,
);

router.post(
  "/api/instructor/theses/:thesisId/presentation-details",
  authMiddleware("instructor"),
  instructorController.setPresentationDetails,
);

module.exports = router;
