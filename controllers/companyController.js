const Company = require("../models/companyModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const CompanyUser = require("../models/companyUserModel");

exports.createCompany = catchAsync(async (req, res, next) => {
  const { createdBy } = req.body;

  if (!createdBy) {
    return next(new AppError("createdBy (user id) is required", 400));
  }

  /* 1️⃣ CREATE COMPANY */
  const company = await Company.create(req.body);

  /* 2️⃣ CREATE COMPANY OWNER */
  await CompanyUser.create({
    user: createdBy,
    company: company._id,
    role: "OWNER",
    status: "APPROVED",
  });

  res.status(201).json({
    status: "success",
    data: {
      company,
    },
  });
});
exports.getAllCompanies = catchAsync(async (req, res, next) => {
  const companies = await Company.find();

  res.status(200).json({
    status: "success",
    results: companies.length,
    data: {
      companies,
    },
  });
});

exports.getCompany = catchAsync(async (req, res, next) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    return next(new AppError("No company found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      company,
    },
  });
});

exports.updateCompany = catchAsync(async (req, res, next) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!company) {
    return next(new AppError("No company found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      company,
    },
  });
});

exports.deleteCompany = catchAsync(async (req, res, next) => {
  const company = await Company.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!company) {
    return next(new AppError("No company found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Company deactivated successfully",
  });
});

exports.getMyCompany = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const company = await Company.findOne({ createdBy: userId });

  console.log("entered");

  if (!company) {
    return next(new AppError("No company found for this user", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      company,
    },
  });
});
