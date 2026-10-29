import express from "express";
import {
  deleteAdminGroup,
  deleteAdminMessage,
  deleteAdminUser,
  createAdminGroup,
  getAdminGroups,
  getAdminMessages,
  getAdminOverview,
  getAdminUsers,
  setUserSuspension,
  setUserPlatformAdmin,
  updateAdminGroupLock,
  updateAdminGroup,
  updateAdminGroupMember,
} from "../contollers/adminController.js";
import { protect } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();
router.use(protect, requireAdmin);

router.get("/overview", getAdminOverview);
router.get("/users", getAdminUsers);
router.patch("/users/:userId/suspension", setUserSuspension);
router.patch("/users/:userId/admin", setUserPlatformAdmin);
router.delete("/users/:userId", deleteAdminUser);
router.get("/messages", getAdminMessages);
router.delete("/messages/:messageId", deleteAdminMessage);
router.post("/groups", createAdminGroup);
router.get("/groups", getAdminGroups);
router.patch("/groups/:groupId", updateAdminGroup);
router.patch("/groups/:groupId/lock", updateAdminGroupLock);
router.patch("/groups/:groupId/members/:userId", updateAdminGroupMember);
router.delete("/groups/:groupId", deleteAdminGroup);

export default router;
