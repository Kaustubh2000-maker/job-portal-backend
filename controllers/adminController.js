const User = require("../models/userModel");
const Company = require("../models/companyModel");
const Job = require("../models/jobModel");
const Application = require("../models/applicationModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
});

exports.getAllCompanies = catchAsync(async (req, res, next) => {
  const companies = await Company.find();

  res.status(200).json({
    status: "success",
    results: companies.length,
    data: { companies },
  });
});

exports.getAllJobs = catchAsync(async (req, res, next) => {
  const jobs = await Job.find()
    .populate("company", "name location")
    .populate("createdBy", "name email");

  res.status(200).json({
    status: "success",
    results: jobs.length,
    data: { jobs },
  });
});

exports.getAllApplications = catchAsync(async (req, res, next) => {
  const applications = await Application.find()
    .populate("job", "title")
    .populate("jobSeeker");
  // .populate("company");

  res.status(200).json({
    status: "success",
    results: applications.length,
    data: { applications },
  });
});
