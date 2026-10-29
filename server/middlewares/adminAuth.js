import User from "../models/User.js";

export const requireAdmin = (req, res, next) => {
  const checkAdmin = async () => {
    const adminIds = (process.env.ADMIN_CLERK_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (adminIds.includes(String(req.userId))) return next();

    const user = await User.findById(req.userId)
      .select("isPlatformAdmin")
      .lean();
    if (!user?.isPlatformAdmin) {
      return res.status(403).json({
        success: false,
        message: "Platform administrator access required",
      });
    }

    return next();
  };

  checkAdmin().catch((error) => {
    console.error("Platform admin authorization failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to verify platform administrator access",
    });
  });
};
