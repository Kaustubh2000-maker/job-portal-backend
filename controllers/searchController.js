const Job = require("../models/jobModel");
const Company = require("../models/companyModel");
const catchAsync = require("../utils/catchAsync");

// exports.globalSearch = catchAsync(async (req, res) => {
//   const { q } = req.query;

//   if (!q || q.trim().length < 2) {
//     return res.status(200).json({
//       status: "success",
//       data: { jobs: [], companies: [] },
//     });
//   }

//   const jobs = await Job.find(
//     { $text: { $search: q }, status: "OPEN" },
//     { score: { $meta: "textScore" } }
//   )
//     .sort({ score: { $meta: "textScore" } })
//     .limit(5)
//     .select("title location company skills experience");

//   const companies = await Company.find(
//     { $text: { $search: q } },
//     { score: { $meta: "textScore" } }
//   )
//     .sort({ score: { $meta: "textScore" } })
//     .limit(5)
//     .select("name industry location");

//   res.status(200).json({
//     status: "success",
//     data: {
//       jobs,
//       companies,
//     },
//   });
// });

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(200).json({
        status: "success",
        data: { jobs: [], companies: [] },
      });
    }

    // escape regex characters
    const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const query = escapeRegex(q.trim());
    const regex = new RegExp(query, "i");

    const jobs = await Job.find({
      status: "OPEN",
      $or: [
        { title: regex },
        { location: regex },
        { skills: regex }, // ✅ FIXED
      ],
    })
      .limit(10)
      .select("title location company skills");

    const companies = await Company.find({
      $or: [{ name: regex }, { industry: regex }, { location: regex }],
    })
      .limit(10)
      .select("name industry location");

    res.status(200).json({
      status: "success",
      data: { jobs, companies },
    });
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
