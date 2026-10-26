import express from "express"
import { protect } from "../middlewares/auth.js"
import upload from "../configs/multer.js"
import { acceptConnectionRequest, blockUser, discoverUsers, followUser, getUserConnections, getUserData, getUserProfile, sendConnctionRequest, unblockUser, unfollowUser, updateUserData } from "../contollers/userController.js"
import { getUserRecentMessages } from "../contollers/messageController.js"

const userRouter = express.Router()

userRouter.get("/data" , protect , getUserData)
userRouter.post("/update" , upload.fields([
    {name:"profile", maxCount:1},
    {name:"cover", maxCount:1},
]) , protect , updateUserData)

userRouter.post("/discover" , protect , discoverUsers)
userRouter.post("/follow" , protect , followUser)
userRouter.post("/unfollow" , protect , unfollowUser)
userRouter.post("/connect" , protect , sendConnctionRequest)
userRouter.post("/accept" , protect , acceptConnectionRequest)
userRouter.post("/connections" , protect , getUserConnections)
userRouter.post("/profiles" , protect , getUserProfile)
userRouter.post("/recent-message" , protect , getUserRecentMessages)
userRouter.post("/:userId" , protect )
userRouter.post("/block" , protect , blockUser)
userRouter.post("/unblock" , protect , unblockUser)

export default userRouter;