export const protect = async (req,res,nex) =>{
    try{
        const {userId} = await req.auth()
        if(!userId){
            return res.json({success:false , message:"Not Authentication"})
        }
        nex()
    }catch(error){
        res.json({success:false , message:error.message})
    };
    
}