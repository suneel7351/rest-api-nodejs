import { Router } from "express";
import PaymentController from "../controller/paymentController.js";

import Auth from "../middleware/Authenticate.js";
const paymentRouter = Router();
paymentRouter
  .route("/subscribe")
  .post(Auth.Authenticated, PaymentController.buySubscription);
paymentRouter.route("/razorpaykey").get(PaymentController.sendRazorpayApiKey);
paymentRouter
  .route("/paymentverification")
  .post(Auth.Authenticated, PaymentController.verifyPayment);

paymentRouter
  .route("/subscribe/cancel")
  .delete(Auth.Authenticated, PaymentController.cancelSubscription);
export default paymentRouter;
