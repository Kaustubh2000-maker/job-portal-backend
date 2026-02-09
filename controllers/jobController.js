const Job = require("../models/jobModel");
const CompanyUser = require("../models/companyUserModel");
const catchAsync = require("../utils/catchAsync");
const redisClient = require("../config/redis");
const AppError = require("../utils/appError");

exports.createJob = catchAsync(async (req, res, next) => {
  const { company, createdBy } = req.body;

  if (!company || !createdBy) {
    return next(new AppError("company and createdBy are required", 400));
  }

  // 🔐 check company access (OWNER or APPROVED HR)
  const access = await CompanyUser.findOne({
    user: createdBy,
    company,
    status: "APPROVED",
  });

  if (!access) {
    return next(new AppError("No permission to create job", 403));
  }

  const job = await Job.create(req.body);

  res.status(201).json({
    status: "success",
    data: { job },
  });
});

// exports.getAllJobs = catchAsync(async (req, res, next) => {
//   const jobs = await Job.find({ status: "OPEN" })
//     .populate("company", "name location")
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     status: "success",
//     results: jobs.length,
//     data: { jobs },
//   });
// });

exports.getAllJobs = catchAsync(async (req, res, next) => {
  const redisKey = "jobs:open";

  const cachedJobs = await redisClient.get(redisKey);

  if (cachedJobs) {
    const jobs = JSON.parse(cachedJobs);

    return res.status(200).json({
      status: "success",
      source: "redis",
      results: jobs.length,
      data: { jobs },
    });
  }

  const jobs = await Job.find({ status: "OPEN" })
    .populate("company", "name location")
    .sort({ createdAt: -1 });

  await redisClient.setEx(
    redisKey,
    60, // ⏱️ cache for 60 seconds
    JSON.stringify(jobs)
  );

  res.status(200).json({
    status: "success",
    source: "database",
    results: jobs.length,
    data: { jobs },
  });
});

exports.getJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate(
    "company",
    "name location website"
  );

  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { job },
  });
});

exports.updateJob = catchAsync(async (req, res, next) => {
  const { updatedBy } = req.body;

  if (!updatedBy) {
    return next(new AppError("updatedBy is required", 400));
  }

  const job = await Job.findById(req.params.id);
  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  const access = await CompanyUser.findOne({
    user: updatedBy,
    company: job.company,
    status: "APPROVED",
  });

  if (!access) {
    return next(new AppError("No permission to update job", 403));
  }

  // ✅ allow only safe fields
  const allowedFields = [
    "title",
    "description",
    "location",
    "employmentType",
    "experienceLevel",
    "skills",
    "salaryRange",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      job[field] = req.body[field];
    }
  });

  await job.save();

  res.status(200).json({
    status: "success",
    data: { job },
  });
});

exports.closeJob = catchAsync(async (req, res, next) => {
  const { closedBy } = req.body;

  const job = await Job.findById(req.params.id);
  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  const access = await CompanyUser.findOne({
    user: closedBy,
    company: job.company,
    status: "APPROVED",
  });

  if (!access) {
    return next(new AppError("No permission to close job", 403));
  }

  job.status = "CLOSED";
  await job.save();

  res.status(200).json({
    status: "success",
    message: "Job closed successfully",
  });
});

exports.getJobsByCompany = catchAsync(async (req, res, next) => {
  const { companyId } = req.params;
  const { requestedBy } = req.query;

  if (!requestedBy) {
    return next(new AppError("requestedBy (user id) is required", 400));
  }

  // Check access: OWNER or APPROVED HR of same company
  const access = await CompanyUser.findOne({
    user: requestedBy,
    company: companyId,
    status: "APPROVED",
  });

  if (!access) {
    return next(new AppError("No permission to view company jobs", 403));
  }

  const jobs = await Job.find({ company: companyId }).sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: jobs.length,
    data: {
      jobs,
    },
  });
});

exports.searchJobs = catchAsync(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(200).json({
      status: "success",
      results: 0,
      data: { jobs: [] },
    });
  }

  const jobs = await Job.find(
    { $text: { $search: q }, status: "OPEN" },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(20);

  res.status(200).json({
    status: "success",
    results: jobs.length,
    data: { jobs },
  });
});
