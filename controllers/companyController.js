const Company = require("../models/companyModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const CompanyUser = require("../models/companyUserModel");
exports.createCompany = catchAsync(async (req, res, next) => {
  const { createdBy } = req.body;

  if (!createdBy) {
    return next(new AppError("createdBy (user id) is required", 400));
  }

  // 1️⃣ HARD BLOCK: user already linked to a company
  const existingCompanyUser = await CompanyUser.findOne({
    user: createdBy,
    // status: { $in: ["PENDING", "APPROVED"] },
  });

  if (existingCompanyUser) {
    return next(
      new AppError(
        "You already have a company account. Please use a different email to create another company.",
        409
      )
    );
  }

  // 2️⃣ CREATE COMPANY
  const company = await Company.create(req.body);

  try {
    // 3️⃣ CREATE OWNER RELATION
    await CompanyUser.create({
      user: createdBy,
      company: company._id,
      role: "OWNER",
      status: "APPROVED",
    });
  } catch (error) {
    // rollback company if relation fails
    await Company.findByIdAndDelete(company._id);

    if (error.code === 11000) {
      return next(
        new AppError(
          "You already have a company account. Please use a different email.",
          409
        )
      );
    }

    throw error;
  }

  res.status(201).json({
    status: "success",
    data: { company },
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

exports.getCompanies = catchAsync(async (req, res) => {
  const { q } = req.query;

  let companies;

  if (q && q.trim().length >= 2) {
    companies = await Company.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(50);
  } else {
    companies = await Company.find().sort("name").limit(50);
  }

  res.status(200).json({
    status: "success",
    results: companies.length,
    data: { companies },
  });
});
