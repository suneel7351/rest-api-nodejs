import { instance } from "../server.js";
import AsyncError from "../middleware/AsyncError.js";
import User from "../models/User.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import crypto from "crypto";
import Payment from "../models/Payment.js";
class PaymentController {
  // <---------------------------------Buy Subscription--------------------------->

  static buySubscription = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (user.role === "admin")
      return next(new ErrorHandler("Admin can not buy subscription.", 400));

    const subscription = await instance.subscriptions.create({
      plan_id: process.env.PLAN_ID,
      customer_notify: 1,
      total_count: 12,
    });

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;
    await user.save();

    res.status(200).json({ success: true, subscriptionId: subscription.id });
  });

  //   <------------------------Verify Payment----------------------------->

  static verifyPayment = AsyncError(async (req, res, next) => {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

    const user = await User.findById(req.user._id);

    const subscribe_id = user.subscription.id;
    const generated_signature = crypto
      .createHmac("sha256", process.env.KEY_SECRET)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id, "utf-8")
      .digest("hex");

    const Authentic = razorpay_signature === generated_signature;

    if (!Authentic)
      return res.redirect(`${process.env.CLIENT_URL}/paymentfail`);

    await Payment.create({
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    });

    user.subscription.status = "active";

    await user.save();

    res.redirect(
      `${process.env.CLIENT_URL}/paymentsuccess?reference=${razorpay_payment_id}`
    );
  });

  //   <-------------------------------------Send Razorpay Api key------------------------------>
  static sendRazorpayApiKey = AsyncError(async (req, res, next) => {
    res.status(200).json({ success: true, key: process.env.KEY_ID });
  });

  //   <----------------------Cancel Subscription-------------------------->

  static cancelSubscription = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    let refund = false;

    const subscribeId = user.subscription.id;
    await instance.subscriptions.cancel(subscribeId);
    const payment = await Payment.findOne({
      razorpay_subscription_id: subscribeId,
    });

    const gap = Date.now() - payment.createdAt;
    const refundTime = process.env.REFUND_TIME * 24 * 60 * 60 * 1000;

    if (refundTime > gap) {
      await instance.payments.refund(payment.razorpay_payment_id);
      refund = true;
    }

    await payment.remove();

    user.subscription.id = undefined;
    user.subscription.status = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: refund
        ? "Subscription cancelled,you will get fully payment within working 7 days."
        : "Subscription cancelled,no refund initiate becasue subscription cancel after 7 days.",
    });
  });
}

export default PaymentController;
