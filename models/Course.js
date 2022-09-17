import { Schema, model } from "mongoose";
import validator from "validator";
const CourseSchema = new Schema({
  title: {
    type: String,
    required: true,
    minLength: [10, "Title must be atleast 10 characters long."],
    maxLength: [100, "Title can not exceed 100 characters ."],
  },
  description: {
    type: String,
    required: true,
    minLength: [20, "Description must be atleast 20 characters long."],
  },
  lectures: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      video: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    },
  ],

  poster: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  views: {
    type: Number,
    default: 0,
  },
  noOfVideo: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: [true, "Enter the creator name"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Course = model("course", CourseSchema);
export default Course;
