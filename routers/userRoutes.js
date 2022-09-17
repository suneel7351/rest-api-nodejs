import { Router } from "express";
import UserController from "../controller/usercontroller.js";
import Auth from "../middleware/Authenticate.js";
import singleUpload from "../middleware/multer.js";
const userRouter = Router();

userRouter.route("/register").post(singleUpload, UserController.register);
userRouter.route("/login").post(UserController.login);
userRouter.route("/logout").post(UserController.logout);
userRouter.route("/me").get(Auth.Authenticated, UserController.myProfile);
userRouter
  .route("/changepassword")
  .put(Auth.Authenticated, UserController.changePassword);
userRouter
  .route("/updateprofile")
  .put(Auth.Authenticated, UserController.updateProfile);
userRouter
  .route("/updateprofilepicture")
  .put(Auth.Authenticated, singleUpload, UserController.updateProfilePicture);

userRouter.route("/forgetpassword").post(UserController.forgetPassword);
userRouter.route("/resetpassword/:token").put(UserController.resetPassword);
userRouter
  .route("/addtoplaylist")
  .put(Auth.Authenticated, UserController.addToPlaylist);
userRouter
  .route("/removefromplaylist")
  .delete(Auth.Authenticated, UserController.removeFromPlaylist);
userRouter
  .route("/admin/users")
  .post(Auth.Authenticated, Auth.AdminAuthrization, UserController.getAllUsers);
userRouter
  .route("/admin/user/:id")
  .put(
    Auth.Authenticated,
    Auth.AdminAuthrization,
    UserController.updateUserRole
  )
  .delete(
    Auth.Authenticated,
    Auth.AdminAuthrization,
    UserController.deleteUser
  );
export default userRouter;
