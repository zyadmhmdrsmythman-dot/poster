import express from "express";
import cors from "cors";
import "dotenv/config";
import { serve } from "inngest/express";
import connectDB from "./configs/db.js";
import { functions, inngest } from "./inngest/index.js";

const app = express();

app.use(express.json());
app.use(cors());

// مسار فحص حالة السيرفر
app.get("/", async (req, res) => {
  try {
    await connectDB();
    res.send("Server is running and Database is connected!");
  } catch (error) {
    res.status(500).send(`Server is running, but DB failed: ${error.message}`);
  }
});

// مسار Inngest
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
    signingKey: process.env.INNGEST_SIGNING_KEY,
  })
);

// تشغيل المنفذ محلياً فقط وتصدير التطبيق لـ Vercel
const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;