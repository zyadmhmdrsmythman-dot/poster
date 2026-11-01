import express from "express";
import {
  createGroup,
  addGroupAdmin,
  removeGroupAdmin,
  removeGroupMember,
  leaveGroup,
  setGroupChatLock,
  acceptMember,
  getGroupMessages,
  getGroupRequests,
  getAvailableGroups,
  getJoinedGroups,
  joinGroup,
} from "../contollers/groupController.js";
import Group from "../models/groupModel.js";
import User from "../models/User.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

const addMemberProfiles = async (groups) => {
  const memberIds = groups.flatMap((group) =>
    group.members.map((member) => member.userId)
  );
  const users = await User.find({ _id: { $in: memberIds } })
    .select("_id full_name username profile_picture")
    .lean();
  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return groups.map((group) => {
    const groupData = group.toObject();
    groupData.members = groupData.members.map((member) => ({
      ...member,
      profile: usersById.get(String(member.userId)) || null,
    }));
    return groupData;
  });
};

router.post("/", protect, createGroup);
router.get("/available", protect, getAvailableGroups);
router.get("/owned/:ownerId", protect, async (req, res) => {
  try {
    if (String(req.params.ownerId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const groups = await Group.find({ owner: req.params.ownerId });
    res.json({ groups: await addMemberProfiles(groups) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/join", protect, joinGroup);
router.patch("/:id/admin", protect, addGroupAdmin);
router.delete("/:id/members/:targetUserId", protect, removeGroupMember);
router.delete("/:id/admin/:targetUserId", protect, removeGroupAdmin);
router.delete("/:id/leave", protect, leaveGroup);
router.patch("/:id/chat-lock", protect, setGroupChatLock);

router.get("/:id", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isAcceptedMember = group.members.some(
      (member) =>
        String(member.userId) === String(req.userId) &&
        member.status === "accepted"
    );
    if (!isAcceptedMember) {
      return res.status(403).json({
        success: false,
        message: "Only accepted group members can view this group",
      });
    }

    const [groupData] = await addMemberProfiles([group]);
    groupData.members = groupData.members.filter(
      (member) => member.status === "accepted"
    );
    res.json(groupData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/requests", protect, getGroupRequests);
router.post("/:id/accept", protect, acceptMember);
router.get("/:id/messages", protect, getGroupMessages);
router.get("/joined/:userId", protect, getJoinedGroups);
router.post("/:id/:join", protect, joinGroup);

export default router