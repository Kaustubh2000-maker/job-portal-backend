const Application = require("../models/applicationModel");
const Job = require("../models/jobModel");
const JobSeeker = require("../models/jobseekerModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createApplication = catchAsync(async (req, res, next) => {
  const { jobId, jobSeekerId, applyType } = req.body;

  console.log("this is create applicioan", jobId, jobSeekerId, applyType);

  if (!jobId || !jobSeekerId || !applyType) {
    return next(new AppError("Missing required fields", 400));
  }

  // check apply type
  if (!["APPLY_NOW", "APPLY_WITH_NEW_RESUME"].includes(applyType)) {
    return next(new AppError("Invalid applyType", 400));
  }

  // job open check
  const job = await Job.findById(jobId);
  if (!job || job.status !== "OPEN") {
    return next(new AppError("Job is not open", 400));
  }

  //   const jobSeeker = await JobSeeker.findById(jobSeekerId);
  //
  const jobSeeker = await JobSeeker.findById(jobSeekerId).populate(
    "user",
    "name email mobile"
  );

  if (!jobSeeker) {
    return next(new AppError("Job seeker not found", 404));
  }

  const data = {
    job: jobId,
    jobSeeker: jobSeekerId,
    applyType,
    profileSnapshot: {
      name: jobSeeker.user.name,
      email: jobSeeker.user.email,
      mobile: jobSeeker.user.mobile,
      education: jobSeeker.education,
      workExperience: jobSeeker.workExperience,
      skills: jobSeeker.skills,
    },
  };

  // APPLY_NOW  use existing resume
  if (applyType === "APPLY_NOW") {
    if (!jobSeeker.resume) {
      return next(new AppError("No resume found in profile", 400));
    }
    data.resumeLink = jobSeeker.resume;
    data.resumeSource = "PROFILE";
  }

  // APPLY WITH NEW RESUME
  if (applyType === "APPLY_WITH_NEW_RESUME") {
    if (!req.file) {
      return next(new AppError("New resume file is required", 400));
    }
    data.resumeLink = req.file.path;
    data.resumeSource = "UPLOAD";
  }

  const application = await Application.create(data);

  res.status(201).json({
    status: "success",
    message: "Applied successfully",
    data: { application },
  });
});

exports.getApplicationsByJobSeeker = catchAsync(async (req, res, next) => {
  const { jobSeekerId } = req.params;

  const applications = await Application.find({ jobSeeker: jobSeekerId })
    .populate("job", "title location")
    // .populate("company", "name")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: applications.length,
    data: { applications },
  });
});
