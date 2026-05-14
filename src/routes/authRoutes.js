const express = require("express");
const router = express.Router();
const path = require("path");
const authController = require("../controllers/authController");

// Serve login page
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/views/auth/login.html"));
});

// API endpoint for login
router.post("/login", authController.loginUser);

// API endpoint for logout
router.post("/logout", authController.logoutUser);

// API endpoint to check if user is authenticated
router.get("/check-auth", authController.checkAuth);

module.exports = router;
