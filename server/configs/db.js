import "dotenv/config";
import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri)
      .then(() => {
        console.log("Database Connected");
      })
      .catch((error) => {
        console.error("Database connection error:", error.message);
        throw error;
      })
      .finally(() => {
        connectionPromise = undefined;
      });
  }

  await connectionPromise;
};

export default connectDB;