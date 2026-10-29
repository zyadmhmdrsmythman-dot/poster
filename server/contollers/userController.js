import imageKit from "../configs/imagekit.js";

import User from "../models/User.js";
import fs from "fs";
import Connection from "../models/connections.js"; // تأكد من اسم الملف تماماً
import { inngest } from "../inngest/index.js";
import { getAuth } from "@clerk/express";
import Post from "../models/Post.js";
import { getOrCreateUser } from "../utils/user.js";

// Clerk user IDs are stored directly as the User document's string _id.
const findUserSafe = async (id) => {
  if (!id) return null;
  return User.findById(String(id));
};

// ==================== GET USER DATA ====================
export const getUserData = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No User ID found in token",
      });
    }

    const user = await getOrCreateUser(userId);

    if (!user) {
      throw new Error("Unable to create or load the user profile");
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in getUserData:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE USER DATA ====================
export const updateUserData = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    let { username, bio, location, full_name } = req.body;

    const tempUser = await findUserSafe(userId);
    if (!tempUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!username) {
      username = tempUser.username;
    } else if (tempUser.username !== username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        username = tempUser.username;
      }
    }

    const updatedData = {
      username,
      bio,
      location,
      full_name,
    };

    const profile = req.files?.profile && req.files.profile[0];
    const cover = req.files?.cover && req.files.cover[0];

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imageKit.upload({
        file: buffer,
        fileName: profile.originalname,
      });
      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "512" },
        ],
      });
      updatedData.profile_picture = url;
      fs.unlinkSync(profile.path);
    }

    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imageKit.upload({
        file: buffer,
        fileName: cover.originalname,
      });
      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1200" },
        ],
      });
      updatedData.cover_photo = url;
      fs.unlinkSync(cover.path);
    }

    const updatedUser = await User.findByIdAndUpdate(
      tempUser._id,
      updatedData,
      { returnDocument: "after" }
    );

    return res.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("updateUserData error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DISCOVER USERS ====================
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const discoverUsers = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { input } = req.body;

    const currentUser = await findUserSafe(userId);
    const currentMongoId = currentUser ? String(currentUser._id) : null;

    const blockedByMe = currentUser?.blockedUsers?.map(String) || [];

    const usersWhoBlockedMe = await User.find({
      blockedUsers: { $in: [currentMongoId, userId].filter(Boolean) },
    }).distinct("_id");

    const blockedByOthers = usersWhoBlockedMe.map(String);

    const excludedIds = Array.from(
      new Set(
        [
          ...blockedByMe,
          ...blockedByOthers,
          currentMongoId,
          String(userId),
        ].filter(Boolean)
      )
    );

    const filter = {
      _id: { $nin: excludedIds },
    };

    if (typeof input === "string" && input.trim()) {
      const safePattern = new RegExp(escapeRegex(input.trim()), "i");
      filter.$or = [
        { username: safePattern },
        { email: safePattern },
        { full_name: safePattern },
        { location: safePattern },
      ];
    }

    const users = await User.find(filter)
      .select("_id full_name username profile_picture bio location")
      .limit(20)
      .lean();

    return res.json({ success: true, users });
  } catch (error) {
    console.error("Discover users error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== FOLLOW USER ====================
export const followUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUser = await findUserSafe(userId);
    const targetUser = await findUserSafe(id);

    if (!currentUser || !targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (String(currentUser._id) === String(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const isFollowing = currentUser.following.some(
      (uid) => String(uid) === String(targetUser._id)
    );

    if (isFollowing) {
      return res.status(400).json({
        success: false,
        message: "You are already following this user",
      });
    }

    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);

    await currentUser.save();
    await targetUser.save();

    return res.json({
      success: true,
      message: "Now you are following this user",
    });
  } catch (error) {
    console.error("followUser error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UNFOLLOW USER ====================
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUser = await findUserSafe(userId);
    const targetUser = await findUserSafe(id);

    if (!currentUser || !targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    currentUser.following = currentUser.following.filter(
      (uid) => String(uid) !== String(targetUser._id)
    );
    targetUser.followers = targetUser.followers.filter(
      (uid) => String(uid) !== String(currentUser._id)
    );

    await currentUser.save();
    await targetUser.save();

    return res.json({
      success: true,
      message: "You are no longer following this user",
    });
  } catch (error) {
    console.error("unfollowUser error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SEND CONNECTION REQUEST ====================
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id: recipientId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sender = await findUserSafe(userId);
    const recipient = await findUserSafe(recipientId);

    if (!recipient || !sender) {
      return res
        .status(404)
        .json({ success: false, message: "Recipient user not found" });
    }

    if (String(sender._id) === String(recipient._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a connection request to yourself",
      });
    }

    const senderId = String(sender._id);
    const targetId = String(recipient._id);

    const existingConnection = await Connection.findOne({
      $or: [
        { from_user_id: senderId, to_user_id: targetId },
        { from_user_id: targetId, to_user_id: senderId },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === "accepted") {
        return res.status(400).json({
          success: false,
          message: "You are already connected with this user",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Connection request pending",
      });
    }

    await Connection.create({
      from_user_id: senderId,
      to_user_id: targetId,
      status: "pending",
    });

    return res.json({
      success: true,
      message: "Connection request sent successfully",
    });
  } catch (error) {
    console.error("sendConnectionRequest error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET USER CONNECTIONS ====================
export const getUserConnections = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const user = await findUserSafe(userId);
    const targetIds = user?._id ? [String(user._id)] : [String(userId)];

    // 1. المتابعون والذين أتابعهم
    const followingList = await User.find({
      _id: { $in: user?.following || [] },
    }).select("_id full_name username profile_picture bio location");

    const followersList = await User.find({
      _id: { $in: user?.followers || [] },
    }).select("_id full_name username profile_picture bio location");

    // 2. الطلبات المعلقة الواردة (Pending)
    const pendingDocs = await Connection.find({
      to_user_id: { $in: targetIds },
      status: "pending",
    });

    const pendingSenderIds = pendingDocs.map((c) => c.from_user_id);

    const pendingList = await User.find({ _id: { $in: pendingSenderIds } }).select(
      "_id full_name username profile_picture bio location"
    );

    const sentRequestDocs = await Connection.find({
      from_user_id: { $in: targetIds },
      status: "pending",
    });
    const sentRecipientIds = sentRequestDocs.map((connection) => connection.to_user_id);
    const sentConnections = await User.find({
      _id: { $in: sentRecipientIds },
    }).select("_id full_name username profile_picture bio location");

    // 3. الاتصالات المقبولة (Connections)
    const acceptedDocs = await Connection.find({
      $or: [
        { from_user_id: { $in: targetIds }, status: "accepted" },
        { to_user_id: { $in: targetIds }, status: "accepted" },
      ],
    });

    const connectedUserIds = acceptedDocs.map((c) =>
      targetIds.includes(c.from_user_id) ? c.to_user_id : c.from_user_id
    );

    const connectionsList = await User.find({
      _id: { $in: connectedUserIds },
    }).select("_id full_name username profile_picture bio location");

    return res.json({
      success: true,
      connections: connectionsList,
      followers: followersList,
      following: followingList,
      pendingConnections: pendingList,
      sentConnections,
    });
  } catch (error) {
    console.error("getUserConnections error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ACCEPT CONNECTION REQUEST ====================
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id: senderId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUser = await findUserSafe(userId);
    const senderUser = await findUserSafe(senderId);

    if (!currentUser || !senderUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const myIds = [String(currentUser._id)];
    const theirIds = [String(senderUser._id)];

    // البحث عن الطلب المعلق الموجه لي
    const connection = await Connection.findOne({
      from_user_id: { $in: theirIds },
      to_user_id: { $in: myIds },
      status: "pending",
    });

    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Connection request not found" });
    }

    // تحديث حالة الطلب
    connection.status = "accepted";
    await connection.save();

    // ربط الحسابين في مصفوفة connections لكل منهما
    if (!currentUser.connections.some((id) => String(id) === String(senderUser._id))) {
      currentUser.connections.push(senderUser._id);
      await currentUser.save();
    }

    if (!senderUser.connections.some((id) => String(id) === String(currentUser._id))) {
      senderUser.connections.push(currentUser._id);
      await senderUser.save();
    }

    return res.json({
      success: true,
      message: "Connection accepted successfully",
    });
  } catch (error) {
    console.error("acceptConnectionRequest error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET PROFILE ====================
export const getUserProfile = async (req, res) => {
  try {
    // استخراج الـ ID بأي طريقة ممكنة سواء params أو body أو query
    const profileId =
      req.params?.userId ||
      req.body?.profileId ||
      req.query?.profileId ||
      req.body?.id;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "Profile ID is required",
      });
    }

    // البحث الآمن عن المستخدم المطلوب بروفايله
    const profileDoc = await findUserSafe(profileId);

    if (!profileDoc) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const profile = profileDoc.toObject();

    // جلب المستخدم الحالي للتحقق من الحظر
    const { userId } = getAuth(req);
    const currentUser = userId ? await findUserSafe(userId) : null;

    const isBlocked = Boolean(
      currentUser?.blockedUsers?.some(
        (id) => String(id) === String(profile._id)
      ) ||
      profile?.blockedUsers?.some(
        (id) => String(id) === String(currentUser?._id || userId)
      )
    );

    let posts = [];
    if (!isBlocked) {
      posts = await Post.find({ user: profileDoc._id })
        .sort({ createdAt: -1 })
        .populate("user", "_id full_name username profile_picture");
    }

    delete profile.blockedUsers;

    return res.status(200).json({
      success: true,
      profile,
      posts,
      isBlocked,
    });
  } catch (error) {
    console.error("getUserProfile error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== BLOCK USER ====================
export const blockUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { userIdToBlock } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUser = await findUserSafe(userId);
    const targetUser = await findUserSafe(userIdToBlock);

    if (!currentUser || !targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const targetMongoId = String(targetUser._id);

    if (!currentUser.blockedUsers.some((id) => String(id) === targetMongoId)) {
      currentUser.blockedUsers.push(targetUser._id);
      await currentUser.save();
    }

    return res.json({
      success: true,
      message: "User blocked successfully",
      blockedUsers: currentUser.blockedUsers,
    });
  } catch (error) {
    console.error("blockUser error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UNBLOCK USER ====================
export const unblockUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { userIdToUnblock } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUser = await findUserSafe(userId);
    const targetUser = await findUserSafe(userIdToUnblock);

    if (!currentUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const targetMongoId = targetUser ? String(targetUser._id) : String(userIdToUnblock);

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id) => String(id) !== targetMongoId && String(id) !== String(userIdToUnblock)
    );

    await currentUser.save();

    return res.json({
      success: true,
      message: "User unblocked successfully",
      blockedUsers: currentUser.blockedUsers,
    });
  } catch (error) {
    console.error("unblockUser error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};