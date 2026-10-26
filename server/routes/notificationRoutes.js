import express from "express"
import {protect} from "../middlewares/auth.js"
import { getUserNotifications, markNotificationAsRead } from "../contollers/notificationController.js"

const router = express.Router()

router.get("/", protect , getUserNotifications)
router.put("/read", protect , markNotificationAsRead)

export default router