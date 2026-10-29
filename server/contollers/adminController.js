import { clerkClient } from "@clerk/express";
import Group from "../models/groupModel.js";
import GroupMessage from "../models/groupMessageModel.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js";
import Story from "../models/Story.js";
import Connection from "../models/connections.js";
import User from "../models/User.js";
import { emitGroupEvent, emitUserEvent } from "../utils/groupSocket.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const getBootstrapAdminIds = () =>
  (process.env.ADMIN_CLERK_IDS || "user_3KsjwBBwc1GrwhyGttpMQXf1AvO")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

const getPagination = (req) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
  return { page, limit, skip: (page - 1) * limit };
};

export const getAdminOverview = async (_req, res) => {
  try {
    const [users, suspendedUsers, groups, messages, groupMessages, posts] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isSuspended: true }),
        Group.countDocuments(),
        Message.countDocuments(),
        GroupMessage.countDocuments(),
        Post.countDocuments(),
      ]);

    return res.json({
      success: true,
      stats: { users, suspendedUsers, groups, messages, groupMessages, posts },
    });
  } catch (error) {
    console.error("Failed to load admin overview:", error);
    return res.status(500).json({ success: false, message: "Failed to load dashboard" });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const query = String(req.query.q || "").trim();
    const filter = query
      ? {
          $or: [
            { full_name: { $regex: escapeRegex(query), $options: "i" } },
            { username: { $regex: escapeRegex(query), $options: "i" } },
            { email: { $regex: escapeRegex(query), $options: "i" } },
            { _id: query },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("_id email full_name username profile_picture isSuspended suspendedAt isPlatformAdmin createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const bootstrapIds = new Set(getBootstrapAdminIds());
    const usersWithAdminStatus = users.map((user) => ({
      ...user,
      isPlatformAdmin:
        Boolean(user.isPlatformAdmin) || bootstrapIds.has(String(user._id)),
      isBootstrapAdmin: bootstrapIds.has(String(user._id)),
    }));

    return res.json({ success: true, users: usersWithAdminStatus, page, limit, total });
  } catch (error) {
    console.error("Failed to load admin users:", error);
    return res.status(500).json({ success: false, message: "Failed to load users" });
  }
};

export const setUserSuspension = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.userId) {
      return res.status(400).json({ success: false, message: "You cannot suspend your own account" });
    }

    const { suspended } = req.body;
    if (typeof suspended !== "boolean") {
      return res.status(400).json({ success: false, message: "A boolean suspended value is required" });
    }

    const userToUpdate = await User.findById(userId)
      .select("isPlatformAdmin")
      .lean();
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (
      suspended &&
      (userToUpdate.isPlatformAdmin ||
        getBootstrapAdminIds().includes(String(userId)))
    ) {
      return res.status(400).json({ success: false, message: "Platform administrators cannot be suspended here" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isSuspended: suspended,
          suspendedAt: suspended ? new Date() : null,
        },
      },
      { new: true }
    ).select("_id isSuspended suspendedAt");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (suspended) {
      emitUserEvent(userId, "account_suspended", {
        message: "تم تعليق حسابك بواسطة إدارة المنصة",
      });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Failed to update user suspension:", error);
    return res.status(500).json({ success: false, message: "Failed to update user status" });
  }
};

export const setUserPlatformAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;
    if (typeof isAdmin !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A boolean isAdmin value is required",
      });
    }
    if (String(userId) === String(req.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own administrator access",
      });
    }
    if (getBootstrapAdminIds().includes(String(userId))) {
      return res.status(400).json({
        success: false,
        message: "Bootstrap administrators are managed in the server configuration",
      });
    }

    const target = await User.findById(userId)
      .select("isPlatformAdmin isSuspended")
      .lean();
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (target.isSuspended && isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Reactivate this account before granting administrator access",
      });
    }

    if (!isAdmin && target.isPlatformAdmin && getBootstrapAdminIds().length === 0) {
      const remainingAdmins = await User.countDocuments({
        _id: { $ne: userId },
        isPlatformAdmin: true,
        isSuspended: false,
      });
      if (remainingAdmins === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one active platform administrator must remain",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isPlatformAdmin: isAdmin } },
      { new: true }
    ).select("_id isPlatformAdmin");

    emitUserEvent(userId, "platform_admin_changed", { isAdmin });
    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Failed to update platform admin role:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update platform administrator access",
    });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.userId) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const targetAdmin = await User.findById(userId)
      .select("isPlatformAdmin")
      .lean();
    if (!targetAdmin) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (
      targetAdmin.isPlatformAdmin ||
      getBootstrapAdminIds().includes(String(userId))
    ) {
      return res.status(400).json({ success: false, message: "Platform administrators cannot be deleted here" });
    }

    await User.updateOne({ _id: userId }, { $set: { isSuspended: true } });
    emitUserEvent(userId, "account_suspended", {
      message: "تم حذف حسابك بواسطة إدارة المنصة",
    });
    await clerkClient.users.deleteUser(userId);

    const affectedGroups = await Group.find({
      $or: [{ owner: userId }, { "members.userId": userId }],
    }).select("_id owner");
    const ownedGroups = affectedGroups.filter(
      (group) => String(group.owner) === String(userId)
    );
    const ownedGroupIds = ownedGroups.map((group) => group._id);
    await Promise.all([
      User.deleteOne({ _id: userId }),
      User.updateMany(
        { _id: { $ne: userId } },
        {
          $pull: {
            followers: userId,
            following: userId,
            connections: userId,
            blockedUsers: userId,
          },
        }
      ),
      Post.deleteMany({ user: userId }),
      Story.deleteMany({ user: userId }),
      Message.deleteMany({
        $or: [{ from_user_id: userId }, { to_user_id: userId }],
      }),
      GroupMessage.deleteMany({
        $or: [{ sender: userId }, { groupId: { $in: ownedGroupIds.map(String) } }],
      }),
      Group.deleteMany({ _id: { $in: ownedGroupIds } }),
      Group.updateMany(
        { "members.userId": userId },
        { $pull: { members: { userId } } }
      ),
      Connection.deleteMany({
        $or: [{ from_user_id: userId }, { to_user_id: userId }],
      }),
      Notification.deleteMany({
        $or: [{ user: userId }, { from_user: userId }],
      }),
      Story.updateMany(
        { views_count: userId },
        { $pull: { views_count: userId } }
      ),
      Post.updateMany(
        { $or: [{ likes_count: userId }, { "comments.user": userId }] },
        {
          $pull: {
            likes_count: userId,
            comments: { user: userId },
          },
        }
      ),
    ]);

    for (const group of affectedGroups) {
      if (String(group.owner) === String(userId)) {
        emitGroupEvent(group._id, "group_deleted", {
          groupId: String(group._id),
        });
      } else {
        emitGroupEvent(group._id, "group_member_removed", {
          groupId: String(group._id),
          userId: String(userId),
        });
      }
    }

    return res.json({ success: true, message: "User and associated data deleted" });
  } catch (error) {
    console.error("Failed to delete platform user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user and associated data",
    });
  }
};

export const getAdminMessages = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const query = String(req.query.q || "").trim();
    const filter = {};

    if (query) {
      const regex = new RegExp(escapeRegex(query), "i");
      const matchingUsers = await User.find({
        $or: [
          { full_name: regex },
          { username: regex },
          { email: regex },
          { _id: query },
        ],
      })
        .select("_id")
        .limit(500)
        .lean();
      const userIds = matchingUsers.map((user) => user._id);
      filter.$or = [
        { text: regex },
        { from_user_id: { $in: userIds } },
        { to_user_id: { $in: userIds } },
      ];
    }

    const [messages, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Message.countDocuments(filter),
    ]);
    const participants = [...new Set(messages.flatMap((message) => [
      message.from_user_id,
      message.to_user_id,
    ]))];
    const users = await User.find({ _id: { $in: participants } })
      .select("_id full_name username profile_picture")
      .lean();
    const usersById = new Map(users.map((user) => [String(user._id), user]));
    const results = messages.map((message) => ({
      ...message,
      fromUser: usersById.get(String(message.from_user_id)) || null,
      toUser: usersById.get(String(message.to_user_id)) || null,
    }));

    return res.json({ success: true, messages: results, page, limit, total });
  } catch (error) {
    console.error("Failed to load admin messages:", error);
    return res.status(500).json({ success: false, message: "Failed to load messages" });
  }
};

export const deleteAdminMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    return res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("Failed to delete admin message:", error);
    return res.status(500).json({ success: false, message: "Failed to delete message" });
  }
};

export const getAdminGroups = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const query = String(req.query.q || "").trim();
    const filter = query
      ? { name: { $regex: escapeRegex(query), $options: "i" } }
      : {};
    const [groups, total] = await Promise.all([
      Group.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Group.countDocuments(filter),
    ]);
    const userIds = [...new Set(groups.flatMap((group) => [
      group.owner,
      ...group.members.map((member) => member.userId),
    ]))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id full_name username profile_picture")
      .lean();
    const usersById = new Map(users.map((user) => [String(user._id), user]));
    const results = groups.map((group) => ({
      ...group,
      ownerProfile: usersById.get(String(group.owner)) || null,
      members: group.members.map((member) => ({
        ...member,
        profile: usersById.get(String(member.userId)) || null,
      })),
    }));

    return res.json({ success: true, groups: results, page, limit, total });
  } catch (error) {
    console.error("Failed to load admin groups:", error);
    return res.status(500).json({ success: false, message: "Failed to load groups" });
  }
};

export const createAdminGroup = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const ownerId = String(req.body.ownerId || "").trim();
    if (!name || !ownerId) {
      return res.status(400).json({
        success: false,
        message: "Group name and creator user ID are required",
      });
    }

    const owner = await User.findById(ownerId).select("_id");
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "The selected creator does not exist",
      });
    }

    const group = await Group.create({
      name,
      owner: ownerId,
      members: [{ userId: ownerId, status: "accepted", role: "admin" }],
    });
    return res.status(201).json({ success: true, group });
  } catch (error) {
    console.error("Failed to create admin group:", error);
    return res.status(500).json({ success: false, message: "Failed to create group" });
  }
};

export const updateAdminGroup = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $set: { name } },
      { new: true, runValidators: true }
    );
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    return res.json({ success: true, group });
  } catch (error) {
    console.error("Failed to update admin group:", error);
    return res.status(500).json({ success: false, message: "Failed to update group" });
  }
};

export const updateAdminGroupLock = async (req, res) => {
  try {
    const { locked } = req.body;
    if (typeof locked !== "boolean") {
      return res.status(400).json({ success: false, message: "A boolean locked value is required" });
    }
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $set: { chatLocked: locked } },
      { new: true }
    ).select("_id chatLocked");
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    emitGroupEvent(group._id, "group_chat_lock_changed", {
      groupId: String(group._id),
      locked: group.chatLocked,
    });
    return res.json({ success: true, group });
  } catch (error) {
    console.error("Failed to update admin group lock:", error);
    return res.status(500).json({ success: false, message: "Failed to update group" });
  }
};

export const deleteAdminGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    await GroupMessage.deleteMany({ groupId: String(group._id) });
    emitGroupEvent(group._id, "group_deleted", { groupId: String(group._id) });
    return res.json({ success: true, message: "Group and messages deleted" });
  } catch (error) {
    console.error("Failed to delete admin group:", error);
    return res.status(500).json({ success: false, message: "Failed to delete group" });
  }
};

export const updateAdminGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { action } = req.body;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (String(group.owner) === String(userId)) {
      return res.status(400).json({ success: false, message: "The creator cannot be changed or removed" });
    }
    const member = group.members.find(
      (item) => String(item.userId) === String(userId)
    );
    if (!member) {
      return res.status(404).json({ success: false, message: "Group member not found" });
    }

    if (action === "remove") {
      group.members = group.members.filter(
        (item) => String(item.userId) !== String(userId)
      );
    } else if (action === "admin" || action === "member") {
      if (member.status !== "accepted") {
        return res.status(400).json({ success: false, message: "Only accepted members can be assigned a role" });
      }
      member.role = action;
    } else if (action === "accept") {
      if (member.status !== "pending") {
        return res.status(400).json({ success: false, message: "Only pending requests can be accepted" });
      }
      member.status = "accepted";
    } else {
      return res.status(400).json({ success: false, message: "Unsupported member action" });
    }

    await group.save();
    if (action === "remove") {
      emitGroupEvent(group._id, "group_member_removed", {
        groupId: String(group._id),
        userId: String(userId),
      });
    } else if (action === "admin" || action === "member") {
      emitGroupEvent(group._id, "group_member_role_changed", {
        groupId: String(group._id),
        userId: String(userId),
        role: action,
      });
    } else {
      emitGroupEvent(group._id, "group_member_status_changed", {
        groupId: String(group._id),
        userId: String(userId),
        status: "accepted",
      });
    }

    return res.json({ success: true, group });
  } catch (error) {
    console.error("Failed to update admin group member:", error);
    return res.status(500).json({ success: false, message: "Failed to update group member" });
  }
};
