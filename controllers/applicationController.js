const Application = require("../models/applicationModel");
const Job = require("../models/jobModel");
const JobSeeker = require("../models/jobseekerModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const CompanyUser = require("../models/companyUserModel");
const ExcelJS = require("exceljs");

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

exports.updateApplicationStatus = catchAsync(async (req, res, next) => {
  const { status, actionBy } = req.body;

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  if (!actionBy) {
    return next(new AppError("actionBy (user id) is required", 400));
  }

  const application = await Application.findById(req.params.applicationId);

  if (!application) {
    return next(new AppError("Application not found", 404));
  }

  const job = await Job.findById(application.job);

  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  // 🔐 OWNER or APPROVED HR of same company
  const access = await CompanyUser.findOne({
    user: actionBy,
    company: job.company,
    status: "APPROVED",
  });

  if (!access) {
    return next(
      new AppError("No permission to update application status", 403)
    );
  }

  application.status = status;
  await application.save();

  res.status(200).json({
    status: "success",
    message: `Application ${status.toLowerCase()} successfully`,
  });
});

exports.getApplicationsByJobId = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const { status } = req.query; // optional filter
  const userId = req.user.id; // assuming auth middleware

  // 1️⃣ Check job exists
  const job = await Job.findById(jobId);
  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  // 2️⃣ Verify company access (OWNER / APPROVED HR)
  const access = await CompanyUser.findOne({
    user: userId,
    company: job.company,
    status: "APPROVED",
  });

  if (!access) {
    return next(
      new AppError("You do not have permission to view applications", 403)
    );
  }

  // 3️⃣ Build query
  const query = { job: jobId };
  if (status) {
    query.status = status; // PENDING | APPROVED | REJECTED
  }

  // 4️⃣ Fetch applications
  const applications = await Application.find(query)
    .populate("jobSeeker", "user")
    .populate("job", "title location")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: applications.length,
    data: { applications },
  });
});

//////////// FILTER BUILDER

const buildAdminApplicationFilter = (query) => {
  const { status, jobTitle, companyName, candidate, appliedFrom, appliedTo } =
    query;

  const filter = {};

  if (status && status !== "ALL") {
    filter.status = status;
  }

  if (candidate) {
    filter.$or = [
      { "profileSnapshot.name": new RegExp(candidate, "i") },
      { "profileSnapshot.email": new RegExp(candidate, "i") },
    ];
  }

  if (appliedFrom || appliedTo) {
    filter.createdAt = {};
    if (appliedFrom) filter.createdAt.$gte = new Date(appliedFrom);
    if (appliedTo) filter.createdAt.$lte = new Date(appliedTo);
  }

  return filter;
};

exports.getAllApplicationsForAdmin = catchAsync(async (req, res) => {
  const { jobTitle, companyName } = req.query;

  const filter = buildAdminApplicationFilter(req.query);

  let applications = await Application.find(filter)
    .populate({
      path: "job",
      populate: {
        path: "company",
      },
    })
    .sort({ createdAt: -1 });

  // ✅ JOB TITLE FILTER
  if (jobTitle) {
    const jt = jobTitle.toLowerCase();
    applications = applications.filter((a) =>
      a.job?.title?.toLowerCase().includes(jt)
    );
  }

  // ✅ COMPANY NAME FILTER
  if (companyName) {
    const cn = companyName.toLowerCase();
    applications = applications.filter((a) =>
      a.job?.company?.name?.toLowerCase().includes(cn)
    );
  }

  res.status(200).json({
    status: "success",
    results: applications.length,
    data: { applications },
  });
});

exports.exportApplicationsExcel = catchAsync(async (req, res) => {
  const { jobTitle, companyName } = req.query;

  const filter = buildAdminApplicationFilter(req.query);

  let applications = await Application.find(filter).populate({
    path: "job",
    select: "title",
    populate: {
      path: "company",
      select: "name",
    },
  });

  // ✅ SAME JOB TITLE FILTER AS GET ALL
  if (jobTitle) {
    const jt = jobTitle.toLowerCase();
    applications = applications.filter((a) =>
      a.job?.title?.toLowerCase().includes(jt)
    );
  }

  // ✅ SAME COMPANY NAME FILTER AS GET ALL
  if (companyName) {
    const cn = companyName.toLowerCase();
    applications = applications.filter((a) =>
      a.job?.company?.name?.toLowerCase().includes(cn)
    );
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Applications");

  sheet.columns = [
    { header: "Candidate Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Mobile", key: "mobile", width: 15 },
    { header: "Job Title", key: "job", width: 30 },
    { header: "Company", key: "company", width: 30 },
    { header: "Status", key: "status", width: 15 },
    { header: "Applied At", key: "createdAt", width: 18 },
  ];

  applications.forEach((a) => {
    sheet.addRow({
      name: a.profileSnapshot?.name || "",
      email: a.profileSnapshot?.email || "",
      mobile: a.profileSnapshot?.mobile || "",
      job: a.job?.title || "",
      company: a.job?.company?.name || "",
      status: a.status,
      createdAt: a.createdAt ? a.createdAt.toISOString().split("T")[0] : "",
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=applications.xlsx"
  );

  await workbook.xlsx.write(res);
  res.end();
});
