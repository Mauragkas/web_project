const express = require("express");
const router = express.Router();
// Default route redirects to login
router.get("/", (req, res) => res.redirect("/auth/login"));
