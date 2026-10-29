import Notification from "../models/Notification.js";
import { getAuth } from "@clerk/express";

//========= CREATE NOTIFICATION =========

export const createdNotifiction = async ({
  userId,
  fromUserId,
  type,
  postId = null,
  commentText = null,
}) => {
  try {
    if (!userId || !fromUserId || !type)
      throw new Error("Missing required fields for notification");
    const notification = await Notification.create({
      user: userId,
      from_user: fromUserId,
      type: type.toLowerCase(),
      post: postId,
      commentText,
    });
    return notification;
  } catch (error) {
    console.error("notification creation error", error);
  }
};

//========== GET USER NOTIFICATION ============

export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notifications = await Notification.find({ user: userId })
      .populate("from_user", "full_name username profile_picture")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error in getUserNotifications:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// =========== MURK NOTIFIATION AS READ ===========

export const markNotificationAsRead = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { notificationId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification is required",
      });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    ).populate("from_user", "full_name username profile_picture");

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    return res.json({
      success: true,
      notification,
      message: "Notification marked as read successfully",
    });
  } catch (error) {
    console.error("Mark notification read error : ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. تمييز جميع إشعارات المستخدم كمقروءة دفعة واحدة
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read successfully",
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
