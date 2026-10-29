import "dotenv/config";
import express from "express";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest } from "./inngest/index.js";
import userRouter from "./routes/userRoutes.js";
import connectDB from "./configs/db.js";
import postRouter from "./routes/postRoutes.js";
import storyRouter from "./routes/storyRoutes.js"
import messageRouter from "./routes/messageRouter.js";
import { getUserNotifications } from "./contollers/notificationController.js";
import {createServer} from "http"
import { Server } from "socket.io";
import { verifyToken } from "@clerk/express";
import Group from "./models/groupModel.js";
import GroupMessage from "./models/groupMessageModel.js";
import User from "./models/User.js";
import groupRouter from "./routes/groupRoutes.js"
import adminRouter from "./routes/adminRoutes.js"
import { setGroupSocketServer } from "./utils/groupSocket.js";


const app = express();
const httpServer = createServer(app)

// إعداد الـ Middlewares
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
//wensocket setup
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
setGroupSocketServer(io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token || !process.env.CLERK_SECRET_KEY) {
      return next(new Error("Authentication required"));
    }

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    if (!payload.sub) {
      return next(new Error("Invalid authentication token"));
    }

    const user = await User.findById(payload.sub).select("isSuspended").lean();
    if (user?.isSuspended) {
      return next(new Error("This account has been suspended"));
    }

    socket.data.userId = payload.sub;
    next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    next(new Error("Authentication failed"));
  }
});

// مسار فحص حالة السيرفر
app.get("/", (req, res) => {
  res.status(200).send("Poster server is live and running!");
});

// مسارات التطبيق
app.use("/api/user", userRouter);
app.use("/api/post" , postRouter);
app.use("/api/story" , storyRouter);
app.use("/api/message" , messageRouter);
app.get("/api/notifications", getUserNotifications);
app.use("/api/group", groupRouter);
app.use("/api/admin", adminRouter);


io.on("connection" , (socket)=>{
  console.log("user connected" , socket.id);
  socket.join(`user:${socket.data.userId}`);

  socket.on("join", async ({ groupId }) => {
    try {
      const group = await Group.findById(groupId).select("members");
      const isMember = group?.members.some(
        (member) =>
          String(member.userId) === String(socket.data.userId) &&
          member.status === "accepted"
      );
      if (isMember) socket.join(String(groupId));
    } catch (error) {
      console.error("Failed to join group socket room:", error);
    }
  });

  socket.on("join_group", async ({ groupId }) => {
    try {
      const group = await Group.findById(groupId).select("members");
      const isMember = group?.members.some(
        (member) =>
          String(member.userId) === String(socket.data.userId) &&
          member.status === "accepted"
      );
      if (isMember) socket.join(String(groupId));
    } catch (error) {
      console.error("Failed to join group socket room:", error);
    }
  });

  socket.on("leave", ({ groupId }) => {
    if (groupId) socket.leave(String(groupId));
  });

  socket.on("send_message", async ({ groupId, text }, acknowledge) => {
    try {
      const trimmedText = typeof text === "string" ? text.trim() : "";
      if (!groupId || !trimmedText) {
        return acknowledge?.({ success: false, message: "Message is required" });
      }

      const group = await Group.findById(groupId).select(
        "owner chatLocked members"
      );
      const member = group?.members.find(
        (groupMember) =>
          String(groupMember.userId) === String(socket.data.userId) &&
          groupMember.status === "accepted"
      );
      if (!group || !member) {
        return acknowledge?.({
          success: false,
          message: "You are not an accepted member of this group",
        });
      }

      const canSendWhileLocked =
        String(group.owner) === String(socket.data.userId) ||
        member.role === "admin";
      if (group.chatLocked && !canSendWhileLocked) {
        return acknowledge?.({
          success: false,
          message: "Chat is locked; only the creator and admins can send",
        });
      }

      const newMessage = await GroupMessage.create({
        groupId,
        sender: socket.data.userId,
        text: trimmedText,
      });
      const senderProfile = await User.findById(socket.data.userId)
        .select("_id full_name username profile_picture")
        .lean();
      io.to(String(groupId)).emit("receive_message", {
        ...newMessage.toObject(),
        senderProfile: senderProfile || null,
      });
      acknowledge?.({ success: true });
    } catch (error) {
      console.error("Failed to send group message:", error);
      acknowledge?.({
        success: false,
        message: "Failed to send message",
      });
    }
  });

  socket.on("disconnect" , ()=>{
    console.log("user disconnected" , socket.id);
  })
})

// مسار استقبال أحداث Inngest
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
    signingKey: process.env.INNGEST_SIGNING_KEY,
  })
);

// تشغيل الخادم والاتصال بالقاعدة محلياً
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "production") {
  startServer();
}

export default app;