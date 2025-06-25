const express = require("express");
const path = require("path");
const router = express.Router();

// Add dashboard route
router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/instructor/dashboard.html"));
});

module.exports = router;
