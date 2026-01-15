const mongoose = require("mongoose");

const jobSeekerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    profilePhoto: {
      type: String,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    dob: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["Fresher", "Experienced"],
      required: true,
    },

    education: [
      {
        degree: String,
        institution: String,
        startYear: Number,
        endYear: Number,
      },
    ],

    workExperience: [
      {
        companyName: String,
        role: String,
        startDate: Date,
        endDate: Date,
        isCurrent: {
          type: Boolean,
          default: false,
        },
      },
    ],

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    resume: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const JobSeeker = mongoose.model("JobSeeker", jobSeekerSchema);
module.exports = JobSeeker;
