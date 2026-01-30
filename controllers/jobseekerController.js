const JobSeeker = require("./../models/jobseekerModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ExcelJS = require("exceljs");
const { deleteFiles } = require("../utils/fileCleanup");
const fs = require("fs");

exports.createJobSeekerProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const existingProfile = await JobSeeker.findOne({ user: userId });
  if (existingProfile) {
    deleteFiles(req.files);
    return next(new AppError("Job seeker profile already exists", 400));
  }

  const data = {
    user: userId,
    ...req.body,
  };

  if (data.skills) {
    data.skills = JSON.parse(data.skills);
  }

  if (data.workExperience) {
    data.workExperience = JSON.parse(data.workExperience);
  }

  if (data.education) {
    data.education = JSON.parse(data.education);
  }

  if (req.files?.profilePhoto) {
    data.profilePhoto = req.files.profilePhoto[0].path;
  }

  if (req.files?.resume) {
    data.resume = req.files.resume[0].path;
  }

  const jobSeeker = await JobSeeker.create(data);

  res.status(201).json({
    status: "success",
    data: { jobSeeker },
  });
});

exports.updateJobSeekerProfile = catchAsync(async (req, res, next) => {
  const jobSeeker = await JobSeeker.findOne({ user: req.params.userId });

  if (!jobSeeker) {
    deleteFiles(req.files);
    return next(new AppError("Job seeker profile not found", 404));
  }

  const data = { ...req.body };

  if (req.files?.profilePhoto) {
    if (jobSeeker.profilePhoto) {
      fs.unlink(jobSeeker.profilePhoto, () => {});
    }
    data.profilePhoto = req.files.profilePhoto[0].path;
  }

  if (req.files?.resume) {
    if (jobSeeker.resume) {
      fs.unlink(jobSeeker.resume, () => {});
    }
    data.resume = req.files.resume[0].path;
  }

  /* ✅ PARSE JSON FIELDS INTO data */
  if (data.skills) {
    data.skills = JSON.parse(data.skills);
  }

  if (data.workExperience) {
    data.workExperience = JSON.parse(data.workExperience);
  }

  if (data.education) {
    data.education = JSON.parse(data.education);
  }

  const updated = await JobSeeker.findOneAndUpdate(
    { user: req.params.userId },
    data,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    data: { jobSeeker: updated },
  });
});

/* ===============================
   GET JOB SEEKER PROFILE ( by userid)
================================ */
exports.getJobSeekerProfile = catchAsync(async (req, res, next) => {
  const jobSeeker = await JobSeeker.findOne({
    user: req.params.userId,
  }).populate("user", "name email mobile");

  if (!jobSeeker) {
    return next(new AppError("Job seeker profile not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      jobSeeker,
    },
  });
});

exports.getMyJobSeekerProfile = async (req, res, next) => {
  const jobseeker = await JobSeeker.findOne({ user: req.user.id });
  if (!jobseeker) {
    return res.status(404).json({
      status: "fail",
      message: "Jobseeker profile not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      jobseeker,
    },
  });
};

const buildJobSeekerAdminFilter = (query) => {
  const { search, gender, status, skill, createdAfter } = query;

  const filter = {};

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { "user.name": regex },
      { "user.email": regex },
      { "user.mobile": regex },
    ];
  }

  if (gender) filter.gender = gender;
  if (status) filter.status = status;

  if (skill) {
    filter.skills = { $in: [new RegExp(skill, "i")] };
  }

  if (createdAfter) {
    filter.createdAt = { $gte: new Date(createdAfter) };
  }

  return filter;
};

// exports.getAllJobSeekersForAdmin = catchAsync(async (req, res, next) => {
//   const { search = "", gender, status, skill, createdAfter } = req.query;

//   const filter = {};

//   /* 🔍 TEXT SEARCH */
//   if (search) {
//     const searchRegex = new RegExp(search, "i");
//     filter.$or = [
//       { "user.name": searchRegex },
//       { "user.email": searchRegex },
//       { "user.mobile": searchRegex },
//     ];
//   }

//   /* 👤 GENDER */
//   if (gender) {
//     filter.gender = gender;
//   }

//   /* 🧑‍💼 STATUS (THIS FIXES YOUR ISSUE) */
//   if (status) {
//     filter.status = status;
//   }

//   /* 🧠 SKILL */
//   if (skill) {
//     filter.skills = { $in: [new RegExp(skill, "i")] };
//   }

//   /* 📅 CREATED AFTER */
//   if (createdAfter) {
//     filter.createdAt = { $gte: new Date(createdAfter) };
//   }

//   const jobSeekers = await JobSeeker.find(filter)
//     .populate("user", "name email mobile role active")
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     status: "success",
//     results: jobSeekers.length,
//     data: {
//       jobSeekers,
//     },
//   });
// });

exports.getAllJobSeekersForAdmin = catchAsync(async (req, res) => {
  const filter = buildJobSeekerAdminFilter(req.query);

  const jobSeekers = await JobSeeker.find(filter)
    .populate("user", "name email mobile role active")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: jobSeekers.length,
    data: {
      jobSeekers,
    },
  });
});

exports.exportJobSeekersExcel = catchAsync(async (req, res) => {
  const filter = buildJobSeekerAdminFilter(req.query);

  const jobSeekers = await JobSeeker.find(filter).populate(
    "user",
    "name email mobile"
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Users");

  sheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Mobile", key: "mobile", width: 15 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Status", key: "status", width: 15 },
    { header: "Skills", key: "skills", width: 30 },
    { header: "Created At", key: "createdAt", width: 15 },
  ];

  jobSeekers.forEach((u) => {
    sheet.addRow({
      name: u.user?.name || "",
      email: u.user?.email || "",
      mobile: u.user?.mobile || "",
      gender: u.gender || "",
      status: u.status || "",
      skills: u.skills?.join(", ") || "",
      createdAt: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "",
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=jobseekers.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});
