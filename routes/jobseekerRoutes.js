const express = require("express");
const jobSeekerController = require("./../controllers/jobseekerController");
const authController = require("./../controllers/authController");
const upload = require("../utils/multer");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.get(
  "/export",
  authController.protect,
  authController.restrictTo("ADMIN"),
  jobSeekerController.exportJobSeekersExcel
);

router.get(
  "/",
  authController.protect,
  authController.restrictTo("ADMIN"),
  jobSeekerController.getAllJobSeekersForAdmin
);

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
