import imageKit from "../configs/imagekit.js";

import User from "../models/User.js";
import fs from "fs";

import Connection from "../models/connections.js";

//get user data using userId
import { getAuth } from "@clerk/express";

export const getUserData = async (req, res) => {
  try {
    // 1. استخراج الـ userId بالطريقة المعتمدة من Clerk
    const { userId } = getAuth(req);

    console.log("--> Authenticated userId:", userId);

    if (!userId) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Unauthorized: No User ID found in token",
        });
    }

    // 2. البحث عن المستخدم بالمعرف النصي الصريح
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found in Database" });
    }

    // 3. إرجاع بيانات المستخدم بنجاح
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in getUserData:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//update user data

export const updateUserData = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findById(userId);
    if (!tempUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    !username && (username = tempUser.username);
    if (tempUser.username !== username) {
      const user = await User.findOne({ username });
      if (user) {
        username = tempUser.username;
      }
    }

    const updatedData = {
      username,
      bio,
      location,
      full_name,
    };

    const profile = req.files?.profile && req.files.profile[0];
    const cover = req.files?.cover && req.files.cover[0];

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imageKit.upload({
        file: buffer,
        fileName: profile.originalname,
      });
      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "512" },
        ],
      });
      updatedData.profile_picture = url;
      fs.unlinkSync(profile.path);
    }

    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imageKit.upload({
        file: buffer,
        fileName: cover.originalname,
      });
      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1200" },
        ],
      });
      updatedData.cover_photo = url;
      fs.unlinkSync(cover.path);
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      returnDocument: "after", //{ new: true } أصبح قديماً ويجب استبداله بـ { returnDocument: 'after' }
    });

    res.json({ success: true, user, message: "Profile update successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//find users using username , email , location , name

export const discoverUsers = async (res, req) => {
  try {
    const { userId } = getAuth(req);
    const { input } = req.body;
    const currentUser = await User.findById(userId).select("blockUsers");
    const blockdByMe = currentUser?.blockedUsers?.map(String) || [];

    const excludedIds = [...blockdByMe, userId];

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: new RegExp(input, "i") },
            { email: new RegExp(input, "i") },
            { full_name: new RegExp(input, "i") },
            { location: new RegExp(input, "i") },
          ],
        },
        {
          _id: { $nin: excludedIds },
        },
      ],
    }).select("_id full_name username profile_picture bio location");
    res.json({ success: true, users });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//Follow User

export const followUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.body;
    const user = await User.findById(userId);
    if (user.following.includes(id)) {
      return res.json({
        success: false,
        message: "You Already Following This User",
      });
    }
    user.following.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers.push(userId);
    await toUser.save();
    res.json({ success: true, message: "Now You Are Following This User" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//Unfollow User

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.body;
    const user = await User.findById(userId);
    user.following = user.following.filter((user) => user !== id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers = toUser.followers.filter((user) => user !== userId);
    await toUser.save();
    res.json({
      success: true,
      message: "You Are No Longer Following This User",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//  send connection request

export const sendConnctionRequest = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.body;
    const last24Hourse = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionRequests = await Connection.find({
      from_user_id: userId,
      created_at: { $gt: last24Hourse },
    });
    if (connectionRequests.length >= 20) {
      return res.json({
        success: false,
        message: "You Have Send than 20 connection in the last 24 hourse",
      });
    }
    const connection = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: userId, to_user_id: id },
      ],
    });
    if (!connection) {
      const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: id,
      });
      await inngest.send({
        name: "app/connection-request",
        data: { connectionId: newConnection._id },
      });
      return res.json({
        success: true,
        message: "Connection request send successfully",
      });
    } else if (connection && connection.status === "accepted") {
      return res.json({
        success: false,
        message:
          "You have sent then 20 connection requests in the last 24 hours",
      });
    }
    return res.json({ success: false, message: "Connection request pending" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//get user connections

export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).populate(
      "connections followers following",
    );
    const connections = user.connections;
    const followers = user.followers;
    const following = following;
    const pendingConnections = (
      await Connection.find({ to_user_id: userId, status: "pending" }).populate(
        "from_user_id",
      )
    ).map((connection) => connection.from_user_id);
    res.json({
      success: true,
      connections,
      followers,
      following,
      pendingConnections,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

//Accept Connection Request

export const acceptConnectionRequest = async (req,res) =>{
  try{
    const {userId} = req.auth()
    const {id} = req.body
    const connection = await Connection.findOne({from_user_id:userId})
    if(!connection){
      return res.json({success:false , message: "connection ton found"})
    }
    const user = await User.findById(userId)
    user.connections.push(id)
    await user.save()
    const toUser = await User.findById(id)
    await toUser.save()

    connection.status = "accepted"
    await connection.save()
    res.json({success:true , message:"connection accepted successfully"})

  }catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
}