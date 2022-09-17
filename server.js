import app from "./app.js";
import connection from "./config/Database.js";
import cloudinary from "cloudinary";
import Razorpay from "razorpay";
import nodecron from "node-cron";
import Stats from "./models/Stats.js";
connection();

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECERET,
});

export const instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

nodecron.schedule("0 0 0 1 * *", async () => {
  try {
    await Stats.create({});
  } catch (error) {
    console.log(error);
  }
});



app.listen(process.env.PORT, () => {
  console.log(`Server is listen on ${process.env.PORT}`);
});
