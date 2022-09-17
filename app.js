import express from "express";
import { config } from "dotenv";
import router from "./routers/courseRoutes.js";
import userRouter from "./routers/userRoutes.js";
import paymentRouter from "./routers/paymentRoutes.js";
import ErrorMiddleware from "./middleware/Error.js";
import cookieParser from "cookie-parser";
import otherRouter from "./routers/route.js";



config({
  path: "./config/config.env",
});
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use("/api/v1", router);
app.use("/api/v1", userRouter);
app.use("/api/v1", paymentRouter);
app.use("/api/v1", otherRouter);
export default app;

app.use(ErrorMiddleware);
