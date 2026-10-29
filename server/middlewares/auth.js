import { getAuth } from "@clerk/express";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please log in",
      });
    }

    req.userId = userId;
    const user = await User.findById(userId).select("isSuspended").lean();
    if (user?.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended",
      });
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};