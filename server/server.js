import express from "express";
import cors from "cors";
import "dotenv/config";
import { serve } from "inngest/express";
import { functions, inngest } from "./inngest/index.js";

const app = express();

app.use(express.json());
app.use(cors());

// مسار فحص حالة السيرفر (سريع وخفيف للتأكد أن السيرفر Live)
app.get("/", (req, res) => {
  res.status(200).send("Poster server is live and running!");
});

// مسار استقبال أحداث Inngest
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
    signingKey: process.env.INNGEST_SIGNING_KEY,
  })
);

// تشغيل المنفذ محلياً فقط وتصدير التطبيق لبيئة Vercel
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;