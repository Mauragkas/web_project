const express = require("express");
const path = require("path");
const publicController = require("../controllers/publicController"); // Add this line
const router = express.Router();

// Serve the announcements page
router.get("/announcements", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../public/views/public/announcements.html"),
  );
});

// Serve the topic catalog page
router.get("/topics", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/views/public/topics.html"));
});

// API endpoint to get available topics
router.get("/api/topics", publicController.getAvailableTopics);

// API endpoint to get all instructors
router.get("/api/instructors", publicController.getAllInstructors);

// API endpoint to get announcements (JSON)
router.get("/api/announcements", publicController.getAnnouncements);

// API endpoint to get announcements feed (XML/JSON)
router.get("/api/announcements/feed", publicController.getAnnouncementsFeed);

module.exports = router;
