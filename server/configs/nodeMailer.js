import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.mailersend.net",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, body }) => {
  const missingConfig = ["SMTP_USER", "SMTP_PASS", "SENDER_EMAIL"].filter(
    (key) => !process.env[key],
  );
  if (missingConfig.length) {
    throw new Error(
      `Email is not configured. Missing environment variables: ${missingConfig.join(", ")}`,
    );
  }
  if (!to || !subject || !body) {
    throw new Error("Email recipient, subject, and body are required");
  }

  return transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    html: body,
  });
};

export default sendEmail;