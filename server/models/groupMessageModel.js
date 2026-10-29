import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
    {
        groupId:{type:String , required:true},
        sender:{type:String , required:true},
        text:{type:String , required:true},
    },
    {timestamps:true}
)

const GroupMessage = mongoose.model("GroupMessage" , groupMessageSchema)

export default GroupMessage