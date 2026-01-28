const Interview = require("../models/interviewModel");
const Application = require("../models/applicationModel");
const Job = require("../models/jobModel");
const JobSeeker = require("../models/jobseekerModel");
const CompanyUser = require("../models/companyUserModel");
const Email = require("../utils/email");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.scheduleInterview = catchAsync(async (req, res, next) => {
  const { applicationId, scheduledAt, meetingLink } = req.body;
  const userId = req.user.id;

  if (!applicationId || !scheduledAt || !meetingLink) {
    return next(new AppError("Missing required fields", 400));
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    return next(new AppError("Application not found", 404));
  }

  if (application.status !== "APPROVED") {
    return next(new AppError("Application not approved", 400));
  }

  const job = await Job.findById(application.job);
  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  const access = await CompanyUser.findOne({
    user: userId,
    company: job.company,
    status: "APPROVED",
  });

  if (!access) {
    return next(new AppError("No permission", 403));
  }

  const interview = await Interview.create({
    application: application._id,
    job: job._id,
    company: job.company,
    jobSeeker: application.jobSeeker,
    scheduledAt,
    meetingLink,
  });

  const jobSeeker = await JobSeeker.findById(application.jobSeeker).populate(
    "user",
    "name email"
  );

  const email = new Email(
    { email: jobSeeker.user.email, name: jobSeeker.user.name },
    meetingLink
  );

  await email.sendInterviewMail({
    jobTitle: job.title,
    scheduledAt,
    meetingLink,
  });

  res.status(201).json({
    status: "success",
    message: "Interview scheduled and email sent",
    data: { interview },
  });
});

exports.getJobSeekerInterviews = catchAsync(async (req, res, next) => {
  const jobSeekerId = req.params.jobSeekerId;

  const interviews = await Interview.find({ jobSeeker: jobSeekerId })
    .populate("job", "title location")
    .sort("scheduledAt");

  res.status(200).json({
    status: "success",
    results: interviews.length,
    data: { interviews },
  });
});

exports.getCompanyInterviews = catchAsync(async (req, res, next) => {
  const companyId = req.params.companyId;

  const interviews = await Interview.find({ company: companyId })
    .populate("job", "title")
    .populate("jobSeeker")
    .sort("scheduledAt");

  res.status(200).json({
    status: "success",
    results: interviews.length,
    data: { interviews },
  });
});
