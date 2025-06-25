const express = require("express");
const path = require("path");
const router = express.Router();

// Serve the announcements page
router.get("/announcements", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/public/announcements.html"));
});

module.exports = router;
