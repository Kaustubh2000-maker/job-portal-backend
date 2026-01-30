const express = require("express");
const applicationController = require("./../controllers/applicationController");
const authController = require("./../controllers/authController");
const { uploadApplicationResume } = require("./../utils/applicationUpload");

const router = express.Router({ mergeParams: true });

router.get("/admin", applicationController.getAllApplicationsForAdmin);

router.get("/admin/export", applicationController.exportApplicationsExcel);

router.post(
  "/",
  uploadApplicationResume.single("resume"),
  applicationController.createApplication
);
router.patch("/:applicationId", applicationController.updateApplicationStatus);

router.get(
  "/jobseeker/:jobSeekerId",
  applicationController.getApplicationsByJobSeeker
);

router.get(
  "/job/:jobId",
  authController.protect,
  applicationController.getApplicationsByJobId
);

module.exports = router;
