const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Job description is required"],
    },

    location: {
      type: String,
      required: [true, "Job location is required"],
      trim: true,
    },

    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"],
      required: true,
    },

    experienceLevel: {
      type: String,
      enum: ["FRESHER", "JUNIOR", "MID", "SENIOR"],
      required: true,
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    salaryRange: {
      min: Number,
      max: Number,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // OWNER or HR user
      required: true,
    },

    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },
  },
  {
    timestamps: true,
  }
);
jobSchema.index({
  title: "text",
  description: "text",
  skills: "text",
  location: "text",
});

const Job = mongoose.model("Job", jobSchema);
module.exports = Job;
