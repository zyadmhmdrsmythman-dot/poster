import fs from "fs"
import imagekit from "../configs/imagekit.js"
import Message from "../models/Message.js"
import {
    addEventStreamClient,
    removeEventStreamClient,
    sendEventToUser,
} from "../utils/eventStream.js";

export const sseController = (req, res) => {
    const { userId } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    addEventStreamClient(userId, res);
    res.write(": Connected to SSE stream\n\n");
    res.on("close", () => {
        removeEventStreamClient(userId, res);
    });
}
//Send Message
export const sendMessage = async(req,res)=>{
    try{
    const {userId} = req.auth()
    const {to_user_id , text} = req.body
    const image = req.file

    let media_url = ""
    let message_type = image ? "image" : "text"

    if(message_type === "image" && image){
        const fileBuffer = fs.readFileSync(image.path)
        const response = await imagekit.upload({
            file:fileBuffer,
            fileName:image.originalname,
        })
        if(response && response.filePath){
            media_url = imagekit.url({
                path:response.filePath,
                transformation:[
                    {quality:"auto"},
                    {format:"webp"},
                    {width:"1290"}
                ]
            })
        }
    }
    const message = await Message.create({
        from_user_id:userId,
        to_user_id,
        text,
        message_type,
        media_url
    })

    sendEventToUser(to_user_id, { type: "message", message });

    res.json({success:true , message})
}catch(error){
    console.log(error);
    res.json({success:false , message:error.message})
    
}}


//Get Chat Message

export const getChatMessages = async(req,res)=>{
    try{
        const {userId} = req.auth()
        const {to_user_id} = req.body
        const messages = await Message.find({
            $or:[
                {from_user_id:userId , to_user_id},
                {from_user_id:to_user_id , to_user_id:userId}
            ]
        }).sort({createdAt : -1})
        await Message.updateMany({from_user_id:to_user_id,to_user_id:userId},
            {seen:true}
        )
        res.json({success:true , messages})

    }catch(error){
    console.log(error);
    res.json({success:false , message:error.message})
    
}}


export const getUserRecentMessages = async(req,res)=>{
    try{
        const {userId} = req.auth()
        const messages =await Message.find({to_user_id:userId}).populate
        ("from_user_id to_user_id").sort({createdAt:-1})

        res.json({success:true , messages})

    }catch(error){
    console.log(error);
    res.json({success:false , message:error.message})
    }
}
