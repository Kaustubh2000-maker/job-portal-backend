const CompanyUser = require("../models/companyUserModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.applyToCompany = catchAsync(async (req, res, next) => {
  const { user, company } = req.body;

  if (!user || !company) {
    return next(new AppError("User and company are required", 400));
  }

  const existing = await CompanyUser.findOne({ user, company });
  if (existing) {
    return next(new AppError("Request already exists", 400));
  }

  const companyUser = await CompanyUser.create({
    user,
    company,
    role: "HR",
    status: "PENDING",
  });

  res.status(201).json({
    status: "success",
    message: "Request sent to company ",
    data: { companyUser },
  });
});

//update the status
exports.updateCompanyUserStatus = catchAsync(async (req, res, next) => {
  const { status, actionBy } = req.body;

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  if (!actionBy) {
    return next(new AppError("actionBy (user id) is required", 400));
  }

  const target = await CompanyUser.findById(req.params.companyUserId);

  if (!target) {
    return next(new AppError("Company user not found", 404));
  }

  //  CHECK: actionBy user is OWNER of SAME company
  console.log("actionBy:", actionBy);
  console.log("target.company:", target.company);

  const allCompanyUsers = await CompanyUser.find({
    company: target.company,
  });
  console.log("ALL company users:", allCompanyUsers);

  const ownerAccess = await CompanyUser.findOne({
    user: actionBy,
    company: target.company,
    role: "OWNER",
    status: "APPROVED",
  });

  if (!ownerAccess) {
    return next(new AppError("Only company owner can approve users", 403));
  }

  target.status = status;
  await target.save();

  res.status(200).json({
    status: "success",
    message: `User ${status.toLowerCase()} successfully`,
  });
});

exports.getPendingCompanyUsers = catchAsync(async (req, res, next) => {
  const companyUsers = await CompanyUser.find({
    company: req.params.companyId,
    status: "PENDING",
  }).populate("user", "name email mobile");

  res.status(200).json({
    status: "success",
    results: companyUsers.length,
    data: {
      companyUsers,
    },
  });
});
