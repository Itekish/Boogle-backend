const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protectRoute = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const token = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password"); // Get user from DB (excluding password)
    
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user; // Attach full user object to request
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token, authorization denied" });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: Insufficient permissions" });
    }
    next();
  };
};

module.exports = { protectRoute, authorizeRoles };

