const express = require("express");
const applicationController = require("./../controllers/applicationController");
const { uploadApplicationResume } = require("./../utils/applicationUpload");

const router = express.Router({ mergeParams: true });

// router.use(authController.protect);

router.post(
  "/",
  uploadApplicationResume.single("resume"),
  applicationController.createApplication
);

router.get(
  "/jobseeker/:jobSeekerId",
  applicationController.getApplicationsByJobSeeker
);

module.exports = router;
