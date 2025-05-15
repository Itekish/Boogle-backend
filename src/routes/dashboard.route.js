// routes/dashboard.route.js
const express = require("express");
const { protectRoute } = require("../middleware/auth");
const { getDashboardStats } = require("../controllers/dashboard.controller");

const router = express.Router();

// Route for dashboard stats (protected route)
router.get("/", protectRoute, getDashboardStats);

module.exports = router;
