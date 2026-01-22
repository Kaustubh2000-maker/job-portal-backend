// const express = require("express");
// const jobSeekerController = require("./../controllers/jobseekerController");
// const upload = require("../utils/multer");

// const router = express.Router();

// console.log("");

// router.post(
//   "/",
//   upload.fields([
//     { name: "profilePhoto", maxCount: 1 },
//     { name: "resume", maxCount: 1 },
//   ]),
//   jobSeekerController.createJobSeekerProfile
// );

// router.patch(
//   "/:userId",
//   upload.fields([
//     { name: "profilePhoto", maxCount: 1 },
//     { name: "resume", maxCount: 1 },
//   ]),
//   jobSeekerController.updateJobSeekerProfile
// );

// router.get("/:userId", jobSeekerController.getJobSeekerProfile);

// module.exports = router;

const express = require("express");
const jobSeekerController = require("./../controllers/jobseekerController");
const upload = require("../utils/multer");
const { protect } = require("../controllers/authController");

const router = express.Router();

// 🔐 GET CURRENT USER JOBSEEKER PROFILE
router.get("/me", protect, jobSeekerController.getMyJobSeekerProfile);

// CREATE PROFILE (onboarding)
router.post(
  "/",
  protect,
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  jobSeekerController.createJobSeekerProfile
);

// UPDATE PROFILE
router.patch(
  "/:userId",
  protect,
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  jobSeekerController.updateJobSeekerProfile
);

// ADMIN / PUBLIC VIEW (optional)
router.get("/:userId", protect, jobSeekerController.getJobSeekerProfile);

module.exports = router;
