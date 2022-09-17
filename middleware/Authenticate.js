import AsyncError from "./AsyncError.js";
import jsonwebtoken from "jsonwebtoken";
import User from "../models/User.js";
import ErrorHandler from "../utils/ErrorHandler.js";
const Authenticated = AsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) return next(new ErrorHandler("Login to continue.", 401));
  const data = await jsonwebtoken.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(data._id);
  next();
});
const AdminAuthrization = (req, res, next) => {
  if (req.user.role !== "admin")
    return next(
      new ErrorHandler(
        `${req.user.role} is not allow to access this resouce.`,
        403
      )
    );
  next();
};

const SubscriberAuthrization = (req, res, next) => {
  if (req.user.subscription.status !== "active" && req.user.role !== "admin")
    return next(
      new ErrorHandler("Only subscriber can access this resources.", 403)
    );
  next();
};

export default { Authenticated, AdminAuthrization, SubscriberAuthrization };
