import express from "express";
import { protect } from "../middlewares/auth.js";
import upload from "../configs/multer.js";
import {
  acceptConnectionRequest,
  blockUser,
  discoverUsers,
  followUser,
  getUserConnections,
  getUserData,
  getUserProfile,
  sendConnectionRequest,
  unblockUser,
  unfollowUser,
  updateUserData,
} from "../contollers/userController.js";
import { getUserRecentMessages } from "../contollers/messageController.js";

const userRouter = express.Router();

// بيانات الحساب والتعديل
userRouter.get("/data", protect, getUserData);
userRouter.post(
  "/update",
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  protect,
  updateUserData
);

// 2. البحث والاستكشاف
userRouter.post("/discover", protect, discoverUsers);

// 3. المتابعة وإلغاء المتابعة
userRouter.post("/follow", protect, followUser);
userRouter.post("/unfollow", protect, unfollowUser);

// 4. طلبات التواصل (Connections)
userRouter.post("/connect", protect, sendConnectionRequest);
userRouter.post("/accept", protect, acceptConnectionRequest);
userRouter.get("/connections", protect, getUserConnections);
userRouter.post("/connections", protect, getUserConnections);

// 5. الحظر وإلغاء الحظر
userRouter.post("/block", protect, blockUser);
userRouter.post("/unblock", protect, unblockUser);

// 6. الرسائل
userRouter.get("/recent-message", protect, getUserRecentMessages);
userRouter.get("/recent-messages", protect, getUserRecentMessages);

// 7. جلب البروفايلات
userRouter.get("/profiles", protect, getUserProfile);
userRouter.post("/profiles", protect, getUserProfile);
userRouter.get("/profile/:userId", protect, getUserProfile);
userRouter.get("/:userId", protect, getUserProfile);

export default userRouter;