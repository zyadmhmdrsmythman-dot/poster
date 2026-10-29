import "dotenv/config";

process.env.CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || "pk_test_Z3VpZGluZy10dXJ0bGUtNzQ5OS5jbGVyay5hY2NvdW50cy5kZXYk";
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "sk_test_I2NT5zNpiJrNMJlccaJODh3a0kClWqGkYGaLdcOr7Q";

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
app.use(async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Request could not connect to the database:", error.message);
    res.status(503).json({
      success: false,
      message: "Database is temporarily unavailable",
    });
  }
});
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY || "pk_test_Z3VpZGluZy10dXJ0bGUtNzQ5OS5jbGVyay5hY2NvdW50cy5kZXYk",
  secretKey: process.env.CLERK_SECRET_KEY || "sk_test_I2NT5zNpiJrNMJlccaJODh3a0kClWqGkYGaLdcOr7Q",
}));
const allowedSocketOrigins = [
  (process.env.FRONTEND_URL || "https://poster-a.vercel.app"),
  ...(process.env.CORS_ORIGINS || "").split(","),
  "https://poster-a.vercel.app",
]
  .filter(Boolean) // تصفية القيم الفارغة و undefined أولاً
  .map((origin) => origin.trim().replace(/\/$/, ""));

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedSocketOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed to connect"));
    },
    methods: ["GET", "POST"],
  },
});
setGroupSocketServer(io);

io.use(async (socket, next) => {
  try {
    await connectDB();
    const token = socket.handshake.auth?.token;
    if (!token || !(process.env.CLERK_SECRET_KEY || "sk_test_I2NT5zNpiJrNMJlccaJODh3a0kClWqGkYGaLdcOr7Q")) {
      return next(new Error("Authentication required"));
    }

    const payload = await verifyToken(token, {
      secretKey: (process.env.CLERK_SECRET_KEY || "sk_test_I2NT5zNpiJrNMJlccaJODh3a0kClWqGkYGaLdcOr7Q"),
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
    signingKey: process.env.INNGEST_SIGNING_KEY || "signkey-prod-ce96989a79c777feb117ad057e484e18f066cc9b9875d50972f7c872da7299b9",
  })
);

// تشغيل الخادم محلياً؛ Vercel يستدعي Express app كـ serverless function.
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

if (!process.env.VERCEL) {
  startServer();
}

export default app;