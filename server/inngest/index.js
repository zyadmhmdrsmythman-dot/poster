import { Inngest } from "inngest";
import connectDB from "../configs/db.js";
import User from "../models/User.js";

// إنشاء العميل
export const inngest = new Inngest({ id: "poster" });

// 1. دالة إنشاء المستخدم
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event }) => {
    await connectDB();

    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const email = email_addresses?.[0]?.email_address || "";
    let username = email ? email.split("@")[0] : `user_${id.slice(-6)}`;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      username = `${username}${Math.floor(Math.random() * 10000)}`;
    }

    const userData = {
      _id: id,
      email: email,
      username: username,
      full_name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
      profile_picture: image_url,
    };

    await User.findByIdAndUpdate(id, userData, { upsert: true, new: true });
    return { success: true };
  }
);

// 2. دالة تحديث بيانات المستخدم
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event }) => {
    await connectDB();

    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const updatedUserData = {
      email: email_addresses?.[0]?.email_address || "",
      full_name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
      profile_picture: image_url,
    };

    await User.findByIdAndUpdate(id, updatedUserData);
    return { success: true };
  }
);

// 3. دالة حذف المستخدم
const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event }) => {
    await connectDB();

    const { id } = event.data;
    await User.findByIdAndDelete(id);
    return { success: true };
  }
);

// تصدير الدوال
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
];