import AsyncError from "../middleware/AsyncError.js";
import Course from "../models/Course.js";
import getDataUri from "../utils/dataUri.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import cloudinary from "cloudinary";
class CourseController {
  // <----------------------Get All Courses----------------------------------->

  static getAllCourses = AsyncError(async (req, res, next) => {
    const keyword = req.query.keyword || "";
    const category = req.query.category || "";
    const courses = await Course.find({
      title: {
        $regex: keyword,
        $options: "i",
      },
      category: {
        $regex: category,
        $options: "i",
      },
    }).select("-lectures");
    res.status(200).json({ success: true, courses });
  });

  // <----------------------------Create New Course---------------------------------->
  static createCourse = AsyncError(async (req, res, next) => {
    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !category || !createdBy)
      return next(new ErrorHandler("All fields are required.", 400));
    const file = req.file;
    const fileUri = getDataUri(file);
    const uploader = await cloudinary.v2.uploader.upload(fileUri.content, {
      folder: "course",
    });

    await Course.create({
      title,
      description,
      category,
      createdBy,
      poster: {
        public_id: uploader.public_id,
        url: uploader.secure_url,
      },
    });
    res.status(201).json({
      success: true,
      message: "New Course added successfully.",
    });
  });

  // <--------------------Get Course Lectures---------------------------------------->

  static getCourseLecture = AsyncError(async (req, res, next) => {
    const course = await Course.findById(req.params.id);
    if (!course) return next(new ErrorHandler("Course not found.", 404));

    course.views += 1;

    await course.save();

    res.status(200).json({ success: true, lectures: course.lectures });
  });

  // <--------------------Add Course Lectures---------------------------------------->

  static addCourseLecture = AsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const file = req.file;
    if (!title || !description || !file)
      return next(new ErrorHandler("All fields are required.", 400));
    const course = await Course.findById(id);
    if (!course) return next(new ErrorHandler("Course not found.", 404));

    const fileUri = getDataUri(file);

    // Max size of video is 100mb--->free version of cloudinary

    const uploader = await cloudinary.v2.uploader.upload(fileUri.content, {
      resource_type: "video",
      folder: "course",
    });
    course.lectures.push({
      title,
      description,
      video: {
        public_id: uploader.public_id,
        url: uploader.secure_url,
      },
    });

    course.noOfVideo = course.lectures.length;

    await course.save();

    res.status(200).json({
      success: true,
      message: "Lecture added successfully.",
    });
  });

  // <-----------------------delete course--------------------------->

  static deleteCourse = AsyncError(async (req, res, next) => {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return next(new ErrorHandler("course not found.", 404));

    await cloudinary.v2.uploader.destroy(course.poster.public_id);

    for (let index = 0; index < course.lectures.length; index++) {
      const lecture = course.lectures[index];
      await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
        resource_type: "video",
      });
    }

    await course.remove();

    res
      .status(200)
      .json({ success: true, message: "Course deleted successfully." });
  });

  // <--------------------------delete lecture---------------------------->

  static deleteLecture = AsyncError(async (req, res, next) => {
    const { courseId, lectureId } = req.query;
    const course = await Course.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found.", 404));
    const lecture = course.lectures.find((item) => {
      if (item._id.toString() === lectureId.toString()) return item;
    });

    await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
      resource_type: "video",
    });

    course.lectures = course.lectures.filter((item) => {
      if (item._id.toString() !== lectureId.toString()) return item;
    });

    course.noOfVideo = course.lectures.length;

    await course.save();

    res
      .status(200)
      .json({ success: true, message: "Lecture deleted successfully." });
  });
}
export default CourseController;
