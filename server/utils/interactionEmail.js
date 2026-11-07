import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import sendEmail from "../configs/nodeMailer.js";

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || "https://poster-a.vercel.app").replace(/\/+$/, "");

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const getEmailRecipient = async (recipientId, eventName) => {
  const clerkUser = await clerkClient.users.getUser(String(recipientId));
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses?.[0]?.emailAddress;

  if (!email) {
    console.warn(
      `Immediate ${eventName} email skipped: recipient ${recipientId} has no email address`,
    );
    return null;
  }

  await User.updateOne({ _id: recipientId }, { $set: { email } });
  return email;
};

export const sendPostInteractionEmail = async ({
  recipientId,
  actorId,
  postId,
  type,
  commentText,
}) => {
  if (String(recipientId) === String(actorId)) return;

  try {
    const [recipientEmail, actor] = await Promise.all([
      getEmailRecipient(recipientId, "post interaction"),
      User.findById(actorId).select("full_name username"),
    ]);
    if (!recipientEmail) return;

    const actorName = escapeHtml(actor?.full_name || "Someone");
    const action = type === "like" ? "liked your post" : "commented on your post";
    const comment = commentText
      ? `<p style="padding:12px;background:#f3f4f6;border-radius:8px;">${escapeHtml(commentText)}</p>`
      : "";
    const postUrl = `${getFrontendUrl()}/post/${encodeURIComponent(postId)}`;

    await sendEmail({
      to: recipientEmail,
      subject: "New activity on your Poster post",
      body: `<div style="font-family:Arial,sans-serif;padding:20px;color:#1f2937;">
<h2>${actorName} ${action}</h2>
${comment}
<p><a href="${postUrl}" style="display:inline-block;padding:10px 16px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">View post</a></p>
</div>`,
    });
  } catch (error) {
    console.error("Failed to send immediate post interaction email:", error);
  }
};

export const sendDirectMessageEmail = async ({ recipientId, senderId }) => {
  if (String(recipientId) === String(senderId)) return;

  try {
    const [recipientEmail, sender] = await Promise.all([
      getEmailRecipient(recipientId, "direct message"),
      User.findById(senderId).select("full_name"),
    ]);
    if (!recipientEmail) return;

    const senderName = escapeHtml(sender?.full_name || "Someone");
    const chatUrl = `${getFrontendUrl()}/messages/${encodeURIComponent(senderId)}`;

    await sendEmail({
      to: recipientEmail,
      subject: "You have a new Poster message",
      body: `<div style="font-family:Arial,sans-serif;padding:20px;color:#1f2937;">
<h2>${senderName} sent you a message</h2>
<p><a href="${chatUrl}" style="display:inline-block;padding:10px 16px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">Open chat</a></p>
</div>`,
    });
  } catch (error) {
    console.error("Failed to send immediate direct message email:", error);
  }
};
