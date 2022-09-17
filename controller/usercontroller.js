import ErrorHandler from "../utils/ErrorHandler.js";
import AsyncError from "../middleware/AsyncError.js";
import User from "../models/User.js";
import sendToken from "../utils/sendToken.js";
import sendMail from "../utils/sendEmail.js";
import crypto from "crypto";
import Course from "../models/Course.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import Stats from "../models/Stats.js";
class UserController {
  // <----------------------Register----------------------------->

  static register = AsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;
    const file = req.file;
    if (!name || !email || !password || !file)
      return next(new ErrorHandler("All fields are required.", 400));
    let user = await User.findOne({ email });
    if (user)
      return next(
        new ErrorHandler("User with this email is already exist.", 409)
      );

    const fileUri = getDataUri(file);

    const upload = await cloudinary.v2.uploader.upload(fileUri.content, {
      folder: "course",
    });
    user = new User({
      name,
      email,
      password,
      avatar: {
        public_id: upload.public_id,
        url: upload.secure_url,
      },
    });
    await user.save();
    sendToken(res, user, "Registered Successfully.", 201);
  });

  // <-------------------------------Login---------------------------------->

  static login = AsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password)
      return next(new ErrorHandler("All fields are required.", 401));
    let user = await User.findOne({ email }).select("+password");
    if (!user) return next(new ErrorHandler("Incorrect Email or Password"));
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new ErrorHandler("Incorrect Email or Password"));
    sendToken(res, user, "Logged in successfully.", 200);
  });

  // <------------------------------Logout--------------------------------------->

  static logout = AsyncError(async (req, res, next) => {
    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()) })
      .json({ success: true, message: "Logged out successfully." });
  });

  // <------------------------MyProfile---------------------------------------------->

  static myProfile = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  });

  // <----------------------------Change password------------------------------------->

  static changePassword = AsyncError(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return next(new ErrorHandler("All fields are required.", 400));
    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch)
      return next(new ErrorHandler("Old password is incorrect.", 400));
    user.password = newPassword;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password change successfully." });
  });

  // <----------------------------Update Profile--------------------------------->

  static updateProfile = AsyncError(async (req, res, next) => {
    const { email, name } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;

    if (email) user.email = email;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Profile updated successfully." });
  });

  // <--------------------------Update profile picture----------------------------->

  static updateProfilePicture = AsyncError(async (req, res, next) => {
    const file = req.file;
    const user = await User.findById(req.user._id);
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    if (!file) return next(new ErrorHandler("file is required", 400));
    const fileUri = getDataUri(file);
    const upload = await cloudinary.v2.uploader.upload(fileUri.content, {
      folder: "course",
    });

    user.avatar = {
      public_id: upload.public_id,
      url: upload.secure_url,
    };

    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Profile picture update successfully." });
  });

  // <------------------------Forget password------------------------------------>

  static forgetPassword = AsyncError(async (req, res, next) => {
    const { email } = req.body;
    if (!email) return next(new ErrorHandler("Email is required.", 400));
    const user = await User.findOne({ email });
    if (!user) return next(new ErrorHandler("No user with this email.", 400));
    const token = user.getResetPasswordToken();
    await user.save();
    const url = `${process.env.CLIENT_URL}/resetpassword/${token}`;
    const message = `That's okay, it happens! Click on the link below to reset your password.\n\n${url}`;
    await sendMail(user.email, "Reset Password", message);
    res
      .status(200)
      .json({ success: true, message: `Email has been sent to ${email}` });
  });

  // <-------------------------Reset Password---------------------------------->

  static resetPassword = AsyncError(async (req, res, next) => {
    const { newPassword } = req.body;
    const { token } = req.params;
    if (!newPassword || !token)
      return next(
        new ErrorHandler("Token and newPassword,both are required.", 400)
      );
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordTokenExpire: {
        $gt: Date.now(),
      },
    });

    if (!user)
      return next(new ErrorHandler("Invalid token or has been expired.", 400));

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password reset successfully." });
  });

  // <---------------------------Add To Playlist---------------------------------->

  static addToPlaylist = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    const course = await Course.findById(req.body.id);
    if (!course) return next(new ErrorHandler("Course not found.", 404));

    const itemExist = user.playlist.find((item) => {
      if (item.course.toString() === course._id.toString()) return true;
    });

    if (itemExist) return next(new ErrorHandler("Course Already exist.", 409));

    user.playlist.push({
      course: course._id,
      poster: course.poster.url,
    });

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Course add to playlist successfully." });
  });

  // <---------------------------Remove From Playlist---------------------------------->

  static removeFromPlaylist = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    const course = await Course.findById(req.query.id);
    if (!course) return next(new ErrorHandler("Course not found.", 404));

    const newPlaylist = user.playlist.filter((item) => {
      if (item.course.toString() !== course._id.toString()) return true;
    });
    user.playlist = newPlaylist;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Course remove from playlist successfully.",
    });
  });

  // <------------------------Get All Users (Admin Route)---------------------->

  static getAllUsers = AsyncError(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  });

  // <--------------------------Update User Role---------------------------------->

  static updateUserRole = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found.", 404));
    if (user.role === "user") user.role = "admin";
    else user.role = "user";

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Role update successfully." });
  });

  // <--------------------------delete User---------------------------------->

  static deleteUser = AsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found.", 404));
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    await user.remove();

    res
      .status(200)
      .json({ success: true, message: "User delete successfully." });
  });
}

// User.watch().on("change", async () => {
//   const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);
//   const subscription = await User.find({ "subscription.status": "active" });
//   stats[0].subscription = subscription.length;
//   stats[0].users = await User.countDocuments();
//   stats[0].createdAt = new Date(Date.now());
//   await stats.save();
// });

export default UserController;
