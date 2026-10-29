import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

export const getOrCreateUser = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    return user;
  }

  const clerkUser = await clerkClient.users.getUser(userId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses?.[0]?.emailAddress ||
    "";
  const baseUsername = email.split("@")[0] || `user_${userId.slice(-6)}`;
  const fullName =
    `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
    "User";

  const createUser = (username) =>
    User.findByIdAndUpdate(
      userId,
      {
        $setOnInsert: {
          email,
          username,
          full_name: fullName,
          profile_picture: clerkUser.imageUrl || "",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

  try {
    const existingUsername = await User.exists({ username: baseUsername });
    return await createUser(
      existingUsername ? `${baseUsername}_${userId}` : baseUsername
    );
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const existingUser = await User.findById(userId);
    if (existingUser) {
      return existingUser;
    }

    return createUser(`${baseUsername}_${userId}`);
  }
};
