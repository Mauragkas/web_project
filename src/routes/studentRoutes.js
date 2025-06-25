const express = require("express");
const path = require("path");
const router = express.Router();

router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/student/dashboard.html"));
});

module.exports = router;
