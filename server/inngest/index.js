import { Inngest } from "inngest";
import connectDB from "../configs/db.js";
import User from "../models/User.js";
import Connection from "../models/connections.js";
import sendEmail from "../configs/nodeMailer.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";

// إنشاء العميل
export const inngest = new Inngest({ id: "my-app" });

// 1. دالة إنشاء المستخدم
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event }) => {
    await connectDB();

    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

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
  },
);

// 2. دالة تحديث بيانات المستخدم
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event }) => {
    await connectDB();

    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const updatedUserData = {
      email: email_addresses?.[0]?.email_address || "",
      full_name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
      profile_picture: image_url,
    };

    await User.findByIdAndUpdate(id, updatedUserData);
    return { success: true };
  },
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
  },
);

//ingest function to send reminder when a new connction request is aded

const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder" },
  { event: "app/connection-request" },
  async ({ event, step }) => {
    const { connectionId } = event.data;
    await step.run("send-connection-request-mail", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id",
      );
      const subject = "New Connection Request";
      const body = `<div style="font-family:Arial, sans-serif; padding:20px;">
<h2>Hi ${connection.to_user_id.full_name}, </h2>
<p>You have a new connection request from ${connection.from_user_id.full_name}
- @${connection.from_user_id.username}</p>
<p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color:#10b981;">here</a>
to accept or reject the request</p>
<br/>
<p>Thanks , <br/>Postly - Stay Connected</p>

</div>
`;
      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
    });
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-houres", in24Hours);
    await step.run("send_connection_request_reminder", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id  to_user_id",
      );
      if (connection.status == "accepted") {
        return { message: "Already accepted" };
      }
      const subject = "New Connection Request";
      const body = `<div style="font-family:Arial, sans-serif; padding:20px;">
<h2>Hi ${connection.to_user_id.full_name}, </h2>
<p>You have a new connection request from ${connection.from_user_id.full_name}
- @${connection.from_user_id.username}</p>
<p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color:#10b981;">here</a>
to accept or reject the request</p>
<br/>
<p>Thanks , <br/>Postly - Stay Connected</p>

</div>
`;
      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
      return { message: "Reminder sent." };
    });
  },
);

const deleteStory = inngest.createFunction(
  { id: "story-delete" },
  { event: "app/story.delete" },
  async ({ event, step }) => {
    const { storyId } = event.data;
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);
    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete(storyId);
      return { message: "Story deleted." };
    });
  },
);

const sendNotificationOfUnseenMessages = inngest.createFunction(
  { id: "seen-unseen-messages-notification" },
  { event: "TZ=Amrica/NEW_YOURK 0 9 * * * *" },
  async ({ step }) => {
    const messages = await Message.find({ seen: false }).populate(
      "to_user_id",
    );
    const unseenCount = {};
    messages.map((message) => {
      unseenCount[message.to_user_id] =
        (unseenCount[message.to_user_id] || 0) + 1;
    });
    for (const userId in unseenCount) {
      const user = await User.findById(userId);
      const subject = `You have ${unseenCount[userId]} unseen messages`;
      const body = `<div style="font-family:Arial, sans-serif; padding:20px;">
<h2>Hi ${user.full_name}, </h2>
<p>You have ${unseenCount[userId]} unseen messages</p>
<p>Click <a href="${process.env.FRONTEND_URL}/messages" style="color:#10b981;">here</a>
to view them</p>
<br/>
<p>Thanks , <br/>Postly - Stay Connected</p>

</div>
`;
      await sendEmail({
        to: user.email,
        subject,
        body,
      });
    }
  },
);

// تصدير الدوال
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendNewConnectionRequestReminder,
  deleteStory,
  sendNotificationOfUnseenMessages,
];
