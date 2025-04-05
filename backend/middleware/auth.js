import jwt from "jsonwebtoken";
import { User } from "../models/UserModel.js";

// I'll look into this after some time
export const authorizedMember = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden. Admins only." });
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token." });
  }
};

export const loggedInUsersOnly = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token." });
  }
};

export const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ success: false, message: "Access denied. No token provided." });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified; // Attach user info to request
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid token." });
  }
};