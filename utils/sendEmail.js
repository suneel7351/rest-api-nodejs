import { createTransport } from "nodemailer";

const sendMail = async (email, subject, text) => {
  const transporter = createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: email,
    subject: subject,
    text,
  });
};

export default sendMail;
