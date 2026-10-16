import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb://localhost:27017/poster");
    console.log(`Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
  }
};

export default connectDB;