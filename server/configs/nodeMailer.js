import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host:"smtp.mailersend.net",
    port:587,
    auth:{
        user: process.env.SMTP_USER || "MS_Fl6au3@test-ywj2lpn93p1g7oqz.mlsender.net",
        pass: process.env.SMTP_PASS || "mssp.unagxnI.3z0vklom7meg7qrx.JzLzOeh",
    }
})

const sendEmail = async ({to , subject , body})=>{
    const response = await transporter.sendEmail({
        from: process.env.SENDER_EMAIL || "zyadmhmdrsmythman@gmail.com",
        subject,
        html:body
    })
    return response
}

export default sendEmail