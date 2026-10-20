import "dotenv/config";
import express from "express";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest } from "./inngest/index.js";
import userRouter from "./routes/userRoutes.js";
import connectDB from "./configs/db.js";

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