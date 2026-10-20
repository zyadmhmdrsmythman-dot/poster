import "dotenv/config";
import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  const uri = process.env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = conn.connections[0].readyState >= 1;
    console.log(`Database Connected`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    throw error;
  }
};

export default connectDB;