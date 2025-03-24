const express = require("express");
const router = express.Router();
const authController = require("../controllers/user.controller");
const { protectRoute } = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/get-user", protectRoute, authController.getUser);
router.patch("/update-user", protectRoute, authController.updateUser);
module.exports = router;
