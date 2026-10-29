import mongoose from "mongoose"

const memberSchema = new mongoose.Schema(
    {
        userId:{type:String , required:true},
        status:{type:String , enum:["pending","accepted"] , default:"pending"},
        role:{type:String , enum:["member","admin"] , default:"member"},
        requestedAt:{type:Date , default:Date.now},
    }
)

const groupSchema = new mongoose.Schema({
    name:{type:String , required:true},
    owner:{type:String , required:true},
    chatLocked:{type:Boolean , default:false},
    members:[memberSchema],
},{timestamps:true})

const Group = mongoose.model("Group" , groupSchema)

export default Group;