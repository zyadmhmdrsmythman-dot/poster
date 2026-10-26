import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getAuth } from "@clerk/express";

const getUserData = async (userId) => {
  try {
    const user = await User.findById(userId)
      .select("_id full_name username profile_picture")
      .lean();

    if (!user) {
      return {
        _id: "",
        full_name: "Unknown",
        username: "Unknown",
        profile_picture: "/default.png",
      };
    }
    return user;
  } catch (error) {
    console.log("Error fetching user data : ", error);
    return {
      _id: "",
      full_name: "Unknown",
      username: "Unknown",
      profile_picture: "/default.png",
    };
  }
};

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
      to_user: userId,
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

    const notifications = await Notification.find({
      $or: [{ to_user: userId }, { user: userId }],
    })
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
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification is required",
      });
    }
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true },
    ).lean();
    const fromUserData = await getUserData(notification.from_user);
    res.json({
      success: true,
      notification: { ...notification, from_user: fromUserData },
      message: "Notification marked as read successfully",
    });
  } catch (error) {
    console.error("Mark notification read error : ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. تمييز جميع إشعارات المستخدم كمقروءة دفعة واحدة
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    await Notification.updateMany(
      { to_user_id: userId, is_read: false },
      { $set: { is_read: true } },
    );

    res.json({
      success: true,
      message: "All notifications marked as read successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
