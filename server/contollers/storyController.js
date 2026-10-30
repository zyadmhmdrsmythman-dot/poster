import fs from "fs";
import Story from "../models/Story.js";
import { getAuth } from "@clerk/express";

import { inngest } from "../inngest/index.js";
import imagekit from "../configs/imagekit.js";
import { getOrCreateUser } from "../utils/user.js";

export const addUserStory = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await getOrCreateUser(userId);

    const { content, media_type, background_color } = req.body;
    const media = req.file;
    let media_url = "";

    if (media_type === "image" || media_type === "video") {
      if (!media) {
        return res.status(400).json({
          success: false,
          message: "Story media file is required",
        });
      }

      const fileBuffer = fs.readFileSync(media.path);
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: media.originalname,
      });
      media_url = response.url;
    }

    const story = await Story.create({
      user: userId,
      content,
      media_url,
      media_type,
      background_color,
    });

    await inngest.send({
      name: "app/story.delete",
      data: { storyId: story._id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error creating story:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStories = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await getOrCreateUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const connections = Array.isArray(user.connections) ? user.connections : [];
    const following = Array.isArray(user.following) ? user.following : [];
    const userIds = [String(user._id), ...connections.map(String), ...following.map(String)];

    const expiresAfter = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({
      user: { $in: userIds },
      createdAt: { $gt: expiresAfter },
    })
      .populate("user")
      .sort({ createdAt: -1 });

    return res.json({ success: true, stories });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUserStory = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const story = await Story.findOneAndDelete({
      _id: req.params.storyId,
      user: userId,
    });
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found or you are not allowed to delete it",
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting story:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};