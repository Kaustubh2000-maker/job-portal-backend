const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    jobSeeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobSeeker",
      required: true,
    },

    applyType: {
      type: String,
      enum: ["APPLY_NOW", "APPLY_WITH_NEW_RESUME"],
      required: true,
    },

    resumeLink: {
      type: String, // existing resume OR new resume
    },

    resumeSource: {
      type: String,
      enum: ["PROFILE", "UPLOAD"],
    },

    profileSnapshot: {
      name: String,
      email: String,
      mobile: String,
      education: Array,
      workExperience: Array,
      skills: [String],
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, jobSeeker: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
