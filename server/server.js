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
import notificationRouter from "./routes/notificationRoutes.js";

const app = express();

// إعداد الـ Middlewares
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

// مسار فحص حالة السيرفر
app.get("/", (req, res) => {
  res.status(200).send("Poster server is live and running!");
});

// مسارات التطبيق
app.use("/api/user", userRouter);
app.use("/api/post" , postRouter);
app.use("/api/story" , storyRouter);
app.use("/api/message" , messageRouter);
app.use("/api/notifications", notificationRouter);

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

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;