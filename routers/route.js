import { Router } from "express";
import Auth from "../middleware/Authenticate.js";
import Controller from "../controller/controllers.js";
const otherRouter = Router();

otherRouter
  .route("/admin/stats")
  .get(Auth.Authenticated, Auth.AdminAuthrization, Controller.adminStats);
otherRouter.route("/contact").get(Controller.contact);
otherRouter.route("/request").get(Controller.request);

export default otherRouter;
