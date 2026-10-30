import Group from "../models/groupModel.js";
import GroupMessage from "../models/groupMessageModel.js";
import User from "../models/User.js";
import { emitGroupEvent } from "../utils/groupSocket.js";

export const createGroup = async (req, res) => {
  try {
    const { name, owner, userId } = req.body;
    const validOwner = owner || userId;

    if (!name || !validOwner) {
      return res.status(400).json({ error: "Group name and owner are required" });
    }

    const group = await Group.create({
      name,
      owner: validOwner,
      members: [{ userId: validOwner, status: "accepted", role: "admin" }],
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

export const addGroupAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetUserId } = req.body;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (String(group.owner) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the group creator can appoint group admins",
      });
    }

    if (!targetUserId || String(targetUserId) === String(group.owner)) {
      return res.status(400).json({
        success: false,
        message: "Choose another accepted group member",
      });
    }

    const member = group.members.find(
      (groupMember) => String(groupMember.userId) === String(targetUserId)
    );
    if (!member || member.status !== "accepted") {
      return res.status(404).json({
        success: false,
        message: "Accepted group member not found",
      });
    }

    member.role = "admin";
    await group.save();
    emitGroupEvent(group._id, "group_member_role_changed", {
      groupId: String(group._id),
      userId: String(targetUserId),
      role: "admin",
    });

    return res.json({
      success: true,
      message: "Group admin appointed",
      group: {
        _id: group._id,
        members: group.members,
      },
    });
  } catch (error) {
    console.error("Failed to appoint group admin:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to appoint group admin",
    });
  }
};

export const removeGroupAdmin = async (req, res) => {
  try {
    const { id, targetUserId } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (String(group.owner) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the group creator can manage group admins",
      });
    }

    if (String(targetUserId) === String(group.owner)) {
      return res.status(400).json({
        success: false,
        message: "The group creator's role cannot be changed",
      });
    }

    const member = group.members.find(
      (groupMember) => String(groupMember.userId) === String(targetUserId)
    );
    if (!member || member.status !== "accepted") {
      return res.status(404).json({
        success: false,
        message: "Accepted group member not found",
      });
    }

    member.role = "member";
    await group.save();
    emitGroupEvent(group._id, "group_member_role_changed", {
      groupId: String(group._id),
      userId: String(targetUserId),
      role: "member",
    });

    return res.json({
      success: true,
      message: "Group admin role removed",
    });
  } catch (error) {
    console.error("Failed to remove group admin:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove group admin role",
    });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const { id, targetUserId } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (String(group.owner) !== String(req.userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the group creator can remove group members",
      });
    }

    if (String(targetUserId) === String(group.owner)) {
      return res.status(400).json({
        success: false,
        message: "The group creator cannot be removed",
      });
    }

    const memberExists = group.members.some(
      (groupMember) =>
        String(groupMember.userId) === String(targetUserId) &&
        groupMember.status === "accepted"
    );
    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "Accepted group member not found",
      });
    }

    group.members = group.members.filter(
      (groupMember) => String(groupMember.userId) !== String(targetUserId)
    );
    await group.save();

    emitGroupEvent(group._id, "group_member_removed", {
      groupId: String(group._id),
      userId: String(targetUserId),
    });

    return res.json({
      success: true,
      message: "Member removed from group",
    });
  } catch (error) {
    console.error("Failed to remove group member:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove group member",
    });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const memberExists = group.members.some(
      (member) =>
        String(member.userId) === String(req.userId) &&
        member.status === "accepted"
    );
    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "Accepted group membership not found",
      });
    }

    group.members = group.members.filter(
      (member) => String(member.userId) !== String(req.userId)
    );
    await group.save();

    emitGroupEvent(group._id, "group_member_removed", {
      groupId: String(group._id),
      userId: String(req.userId),
      action: "left",
    });

    return res.json({ success: true, message: "Left group successfully" });
  } catch (error) {
    console.error("Failed to leave group:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to leave group",
    });
  }
};

export const setGroupChatLock = async (req, res) => {
  try {
    const { id } = req.params;
    const { locked } = req.body;
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const member = group.members.find(
      (groupMember) =>
        String(groupMember.userId) === String(req.userId) &&
        groupMember.status === "accepted"
    );
    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Only accepted group members can change chat settings",
      });
    }

    if (
      String(group.owner) !== String(req.userId) &&
      member.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the group creator or an admin can lock the chat",
      });
    }

    if (typeof locked !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A boolean locked value is required",
      });
    }

    group.chatLocked = locked;
    await group.save();

    emitGroupEvent(group._id, "group_chat_lock_changed", {
      groupId: String(group._id),
      locked: group.chatLocked,
    });

    return res.json({
      success: true,
      chatLocked: group.chatLocked,
    });
  } catch (error) {
    console.error("Failed to update group chat lock:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update group chat lock",
    });
  }
};

export const getAvailableGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: "المجموعة غير موجودة" });
    }

    const alreadyMember = group.members.find(
      (m) => String(m.userId) === String(userId)
    );
    if (alreadyMember) {
      if (alreadyMember.status === "accepted") {
        return res.status(400).json({
          success: false,
          isMember: true,
          message: "أنت بالفعل عضو في هذه المجموعة",
        });
      }
      return res.status(400).json({
        success: false,
        isPending: true,
        message: "طلب الانضمام قيد المراجعة بالفعل",
      });
    }

    group.members.push({ userId, status: "pending", role: "member" });
    await group.save();
    res.json({ success: true, message: "تم إرسال طلب الانضمام بنجاح" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getGroupRequests = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const pendingRequests = group.members.filter((m) => m.status === "pending");
    res.json(pendingRequests);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

export const acceptMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(id);

    if (!group) return res.status(404).json({ error: "Group not found" });

    const member = group.members.find((m) => m.userId === userId);
    if (!member) return res.status(404).json({ message: "Request not found" });

    member.status = "accepted";
    await group.save();
    res.json({ message: "Member accepted" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const messages = await GroupMessage.find({ groupId: req.params.id })
      .sort({ createdAt: 1 })
      .lean();
    const senderIds = [...new Set(messages.map((message) => message.sender))];
    const users = await User.find({ _id: { $in: senderIds } })
      .select("_id full_name username profile_picture")
      .lean();
    const usersById = new Map(users.map((user) => [String(user._id), user]));

    const messagesWithSenders = messages.map((message) => ({
      ...message,
      senderProfile: usersById.get(String(message.sender)) || null,
    }));

    res.json(messagesWithSenders);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

export const getJoinedGroups = async (req, res) => {
  try {
    const { userId } = req.params;
    const groups = await Group.find({
      members: { $elemMatch: { userId, status: "accepted" } },
    });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
