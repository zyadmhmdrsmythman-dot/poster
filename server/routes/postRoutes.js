import express from "express"

import upload from "../configs/multer.js"

import { protect } from "../middlewares/auth.js"
import { addComment, addPost, deletePost, getFeedPosts, getSinglePost, getUserPost, linkPost, updatePost } 
from "../contollers/posterController.js"

const postRouter = express.Router()

postRouter.post("/add" , upload.array("images" , 4) , protect, addPost)

postRouter.get("/feed" , protect , getFeedPosts)
postRouter.post("/like" , protect , linkPost)


postRouter.get("/:postId" , protect , getSinglePost)
postRouter.post("/:postId/comment" , protect , addComment)

postRouter.post("/user/:id" , getUserPost)

postRouter.delete("/delete/:postId",protect, deletePost);
postRouter.put("/update/:postId", protect, updatePost);

export default postRouter;