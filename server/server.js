import express from "express"
import cors from "cors"
import "dotenv/config"
import { serve } from "inngest/express"
import connectDB from "./configs/db.js"
import { functions, inngest } from "./inngest/index.js"

const app = express()

await connectDB()

app.use(express.json())
app.use(cors())

app.get("/", (req, res) => res.send("Server is running"))

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
    signingKey: process.env.INNGEST_SIGNING_KEY,
  })
);
const PORT = process.env.PORT || 4000

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))