const express = require("express");
const router = express.Router();
const authRoutes = require("./authRoutes");
const studentRoutes = require("./studentRoutes");
const instructorRoutes = require("./instructorRoutes");
const secretariatRoutes = require("./secretariatRoutes");
const publicRoutes = require("./publicRoutes");
const { authMiddleware } = require("../middleware/authMiddleware");

// Auth routes (no auth required)
router.use("/auth", authRoutes);

// Public routes (no auth required)
router.use("/public", publicRoutes);

// Default route redirects to public announcements page
router.get("/", (req, res) => res.redirect("/public/announcements"));

// Protected routes
router.use("/student", authMiddleware("student"), studentRoutes);
router.use("/instructor", authMiddleware("instructor"), instructorRoutes);
router.use("/secretariat", authMiddleware("secretariat"), secretariatRoutes);

module.exports = router;
