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

module.exports = router;
