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

router.post("/", createGroup);
router.get("/available", getAvailableGroups);
router.get("/owned/:ownerId", async (req, res) => {
  try {
    const groups = await Group.find({ owner: req.params.ownerId });
    res.json({ groups: await addMemberProfiles(groups) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/join", joinGroup);
router.patch("/:id/admin", protect, addGroupAdmin);
router.delete("/:id/members/:targetUserId", protect, removeGroupMember);
router.delete("/:id/admin/:targetUserId", protect, removeGroupAdmin);
router.delete("/:id/leave", protect, leaveGroup);
router.patch("/:id/chat-lock", protect, setGroupChatLock);

router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const [groupData] = await addMemberProfiles([group]);
    res.json(groupData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/requests", getGroupRequests);
router.post("/:id/accept", acceptMember);
router.get("/:id/messages", getGroupMessages);
router.get("/joined/:userId", getJoinedGroups);
router.post("/:id/:join", joinGroup);

export default router