import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // يجب أن يكون String ليتطابق مع معرف Clerk
    from_user: { type: String, ref: "User", required: true },
    type: { type: String, enum: ["like", "comment", "media"], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    commentText: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);