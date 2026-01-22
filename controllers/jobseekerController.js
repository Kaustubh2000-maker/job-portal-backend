const JobSeeker = require("./../models/jobseekerModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { deleteFiles } = require("../utils/fileCleanup");
const fs = require("fs");

// exports.createJobSeekerProfile = catchAsync(async (req, res, next) => {
//   const { user } = req.body;

//   const existingProfile = await JobSeeker.findOne({ user });
//   if (existingProfile) {
//     deleteFiles(req.files);
//     return next(new AppError("Job seeker profile already exists", 400));
//   }

//   const data = { ...req.body };

//   /* PARSE JSON FIELDS INTO data */
//   if (data.skills) {
//     data.skills = JSON.parse(data.skills);
//   }

//   if (data.workExperience) {
//     data.workExperience = JSON.parse(data.workExperience);
//   }

//   if (data.education) {
//     data.education = JSON.parse(data.education);
//   }

//   /* FILE PATHS */
//   if (req.files?.profilePhoto) {
//     data.profilePhoto = req.files.profilePhoto[0].path;
//   }

//   if (req.files?.resume) {
//     data.resume = req.files.resume[0].path;
//   }

//   const jobSeeker = await JobSeeker.create(data);

//   res.status(201).json({
//     status: "success",
//     data: { jobSeeker },
//   });
// });
exports.createJobSeekerProfile = catchAsync(async (req, res, next) => {
  // ✅ TAKE USER ID FROM TOKEN
  const userId = req.user.id;

  // ❌ DO NOT TRUST req.body.user
  const existingProfile = await JobSeeker.findOne({ user: userId });
  if (existingProfile) {
    deleteFiles(req.files);
    return next(new AppError("Job seeker profile already exists", 400));
  }

  const data = {
    user: userId, // 👈 attach user here
    ...req.body,
  };

  /* PARSE JSON FIELDS */
  if (data.skills) {
    data.skills = JSON.parse(data.skills);
  }

  if (data.workExperience) {
    data.workExperience = JSON.parse(data.workExperience);
  }

  if (data.education) {
    data.education = JSON.parse(data.education);
  }

  /* FILE PATHS */
  if (req.files?.profilePhoto) {
    data.profilePhoto = req.files.profilePhoto[0].path;
  }

  if (req.files?.resume) {
    data.resume = req.files.resume[0].path;
  }

  const jobSeeker = await JobSeeker.create(data);

  res.status(201).json({
    status: "success",
    data: { jobSeeker },
  });
});

exports.updateJobSeekerProfile = catchAsync(async (req, res, next) => {
  const jobSeeker = await JobSeeker.findOne({ user: req.params.userId });

  if (!jobSeeker) {
    deleteFiles(req.files);
    return next(new AppError("Job seeker profile not found", 404));
  }

  const data = { ...req.body };

  // 🧹 Replace profile photo
  if (req.files?.profilePhoto) {
    if (jobSeeker.profilePhoto) {
      fs.unlink(jobSeeker.profilePhoto, () => {});
    }
    data.profilePhoto = req.files.profilePhoto[0].path;
  }

  // 🧹 Replace resume
  if (req.files?.resume) {
    if (jobSeeker.resume) {
      fs.unlink(jobSeeker.resume, () => {});
    }
    data.resume = req.files.resume[0].path;
  }

  /* ✅ PARSE JSON FIELDS INTO data */
  if (data.skills) {
    data.skills = JSON.parse(data.skills);
  }

  if (data.workExperience) {
    data.workExperience = JSON.parse(data.workExperience);
  }

  if (data.education) {
    data.education = JSON.parse(data.education);
  }

  const updated = await JobSeeker.findOneAndUpdate(
    { user: req.params.userId },
    data,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    data: { jobSeeker: updated },
  });
});

/* ===============================
   GET JOB SEEKER PROFILE ( by userid)
================================ */
exports.getJobSeekerProfile = catchAsync(async (req, res, next) => {
  const jobSeeker = await JobSeeker.findOne({
    user: req.params.userId,
  }).populate("user", "name email mobile");

  if (!jobSeeker) {
    return next(new AppError("Job seeker profile not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      jobSeeker,
    },
  });
});

// /me by jobseeker login

exports.getMyJobSeekerProfile = async (req, res, next) => {
  const jobseeker = await JobSeeker.findOne({ user: req.user.id });
  if (!jobseeker) {
    return res.status(404).json({
      status: "fail",
      message: "Jobseeker profile not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      jobseeker,
    },
  });
};
