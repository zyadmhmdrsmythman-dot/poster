import imageKit from "../configs/imagekit.js";
import User from "../models/User.js";
import fs from "fs";
import Post from "../models/Post.js";
import { getAuth } from "@clerk/express";
import { createdNotifiction } from "./notificationController.js";

const getUserData = async (userId) => {
  return (
    (await User.findById(userId)
      .select("_id full_name username profile_picture")
      .lean()) || {
      _id: "",
      full_name: "Unknown",
      username: "Unknown",
      profile_picture: "",
    }
  );
};
const populatePostData = async (post) => {
  const user = await getUserData(post.user);

  const commentWithUser = await Promise.all(
    post.comments.map(async (c) => {
      const commentUser = await getUserData(c.user);
      return { ...c.toObject(), user: commentUser };
    }),
  );
  return { ...post.toObject(), user, comments: commentWithUser };
};
// ===========ADD NEW POST ===========

export const addPost = async (req, res) => {
  try {
    // 1. استخراج المعرف بشكل سليم
    const { userId } = getAuth(req);
    const { content, post_type } = req.body;

    let image_urls = []; // تم تعديل الاسم إلى image_urls

    if (req.files && req.files.length) {
      image_urls = await Promise.all(
        req.files.map(async (file) => {
          const fileBuffer = fs.readFileSync(file.path);
          const response = await imageKit.upload({
            file: fileBuffer,
            fileName: file.originalname,
            folder: "posts",
          });

          // حذف الملف المؤقت من السيرفر بعد رفعه
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          return imageKit.url({
            path: response.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "1200" },
            ],
          });
        })
      );
    }

    // 2. تحديد نوع المنشور تلقائياً إذا لم يُرسل بشكل صريح
    const finalPostType =
      post_type ||
      (image_urls.length > 0
        ? content
          ? "text_with_image"
          : "image"
        : "text");

    const post = await Post.create({
      user: userId,
      content,
      image_urls, // مطابق للـ Schema ومكون الـ PostCard
      post_type: finalPostType,
    });

    return res.json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Error in addPost:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========GET FEED POSTS ==========

export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();

    // جلب معرفات المستخدمين من البوستات
    const userIds = posts.map((p) => p.user);

    // البحث عن المستخدمين المطابقين (سواء بـ _id أو clerk_id حسب حفظك في الـ User Schema)
    const users = await User.find({
      $or: [{ _id: { $in: userIds } }, { clerk_id: { $in: userIds } }],
    }).select("full_name username profile_picture _id clerk_id");

    const usersMap = new Map();
    users.forEach((u) => {
      usersMap.set(String(u._id), u);
      if (u.clerk_id) usersMap.set(String(u.clerk_id), u);
    });

    // استبدال حقل user النصي بكائن المستخدم الكامل
    const postsWithUserData = posts.map((post) => ({
      ...post,
      user: usersMap.get(String(post.user)) || null,
    }));

    res.json({ success: true, posts: postsWithUserData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }
    const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 });
    const postsWithUserData = await Promise.all(posts.map(populatePostData));
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========== LINK / UNLINK POST ===========

export const linkPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    if (!Array.isArray(post.likes_count)) post.likes_count = [];
    const isLiked = post.likes_count.includes(userId);
    if (isLiked) {
      post.likes_count = post.likes_count.filter((id) => id !== userId);
    } else {
      post.likes_count.push(userId);
      if (post.user !== userId) {
        await createdNotifiction({
          userId: post.user,
          fromUserId: userId,
          type: "like",
          postId: post._id,
        });
      }
    }
    await post.save();
    res.json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      likes_count: post.likes_count,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========= GET SINGLE POST ========
export const getSinglePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const postWithUser = await populatePostData(post);
    res.json({ success: true, post: postWithUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//Add Comment

export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.params;
    const { text } = req.body;

    if (!text.trim())
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    post.comments.push({ user: userId, text });
    await post.save();
    if (post.user !== userId) {
      await createdNotification({
        userId: post.user,
        fromUserId: userId,
        type: "comment",
        postId: post._id,
        commentText:text,
      });
    }

    const postWithUser = await populatePostData(post)
    res.json({success:true , message:"Comment added" , post:postWithUser})

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserPost = async (req,res)=>{
    try{
        const {id} = req.params
        const posts = await Post.find({user:id})
        .sort({createdAt:-1})
        .populate("user" , "_id full_name username profile_picture")
        res.json({success:true , posts})
    }catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = getAuth(req);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // التحقق من أن المستخدم الحالي هو صاحب البوست
    if (String(post.user) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    await Post.findByIdAndDelete(postId);

    return res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// تعديل محتوى المنشور
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const { userId } = getAuth(req);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (String(post.user) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    post.content = content ?? post.content;
    await post.save();

    return res.json({ success: true, message: "Post updated successfully", post });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};