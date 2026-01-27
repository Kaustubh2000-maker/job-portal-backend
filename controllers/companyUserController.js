const CompanyUser = require("../models/companyUserModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.applyToCompany = catchAsync(async (req, res, next) => {
  const { user, company } = req.body;

  if (!company) {
    return next(new AppError("Company is required", 400));
  }

  let companyUser = await CompanyUser.findOne({ user: user });

  // 🟢 First-time apply
  if (!companyUser) {
    companyUser = await CompanyUser.create({
      user: user,
      company,
      status: "PENDING",
      role: "HR",
    });

    return res.status(201).json({
      status: "success",
      message: "Request sent to company",
      data: { companyUser },
    });
  }

  // 🔴 Already active
  if (["PENDING", "APPROVED"].includes(companyUser.status)) {
    return next(
      new AppError("You already have an active company request", 400)
    );
  }

  // 🟡 REJECTED → reapply (UPDATE same record)
  companyUser.company = company;
  companyUser.status = "PENDING";
  companyUser.role = "HR";
  await companyUser.save();

  res.status(200).json({
    status: "success",
    message: "Request sent again",
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
// ///////////////////////////////////////

exports.checkCompanyUserExistence = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  if (!userId) {
    return next(new AppError("userId is required", 400));
  }

  const companyUser = await CompanyUser.findOne({ user: userId }).populate(
    "company"
    // "name industry location"
  );

  if (!companyUser) {
    return res.status(200).json({
      status: "success",
      exists: false,
      message: "User has not applied to any company",
    });
  }

  res.status(200).json({
    status: "success",
    exists: true,
    data: {
      companyUserId: companyUser._id,
      company: companyUser.company,
      role: companyUser.role,
      status: companyUser.status,
    },
    message:
      companyUser.status === "PENDING"
        ? "Application already sent, waiting for approval"
        : companyUser.status === "APPROVED"
        ? "User already part of a company"
        : "Application was rejected",
  });
});
