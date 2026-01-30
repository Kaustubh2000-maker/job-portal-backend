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
const buildAdminCompanyFilter = (query) => {
  const { search, industry, location, isActive, createdAfter } = query;

  const filter = {};

  if (search) {
    filter.$text = { $search: search };
  }

  if (industry) {
    filter.industry = new RegExp(industry, "i");
  }

  if (location) {
    filter.location = new RegExp(location, "i");
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (createdAfter) {
    filter.createdAt = { $gte: new Date(createdAfter) };
  }

  return filter;
};
exports.getAllCompaniesForAdmin = catchAsync(async (req, res) => {
  const filter = buildAdminCompanyFilter(req.query);

  const companies = await Company.find(filter).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: "success",
    results: companies.length,
    data: {
      companies,
    },
  });
});

const ExcelJS = require("exceljs");

exports.exportCompaniesExcel = catchAsync(async (req, res) => {
  const filter = buildAdminCompanyFilter(req.query);

  const companies = await Company.find(filter).sort({
    createdAt: -1,
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Companies");

  sheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Industry", key: "industry", width: 25 },
    { header: "Location", key: "location", width: 25 },
    { header: "Website", key: "website", width: 30 },
    { header: "Status", key: "status", width: 15 },
    { header: "Created At", key: "createdAt", width: 18 },
  ];

  companies.forEach((c) => {
    sheet.addRow({
      name: c.name,
      industry: c.industry || "",
      location: c.location || "",
      website: c.website || "",
      status: c.isActive ? "Active" : "Inactive",
      createdAt: c.createdAt ? c.createdAt.toISOString().split("T")[0] : "",
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=companies.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});
