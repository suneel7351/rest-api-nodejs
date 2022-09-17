import { Router } from "express";
import CourseController from "../controller/courseController.js";
import singleUpload from "../middleware/multer.js";
import Auth from "../middleware/Authenticate.js";
const router = Router();
router.route("/courses").get(CourseController.getAllCourses);
router
  .route("/createcourse")
  .post(
    Auth.Authenticated,
    Auth.AdminAuthrization,
    singleUpload,
    CourseController.createCourse
  );
router
  .route("/course/:id")
  .get(
    Auth.Authenticated,
    Auth.SubscriberAuthrization,
    CourseController.getCourseLecture
  )
  .post(
    Auth.Authenticated,
    Auth.AdminAuthrization,
    singleUpload,
    CourseController.addCourseLecture
  )
  .delete(
    Auth.Authenticated,
    Auth.AdminAuthrization,
    singleUpload,
    CourseController.deleteCourse
  );

router
  .route("/lecture")
  .delete(
    Auth.Authenticated,
    Auth.AdminAuthrization,
    CourseController.deleteLecture
  );
export default router;
