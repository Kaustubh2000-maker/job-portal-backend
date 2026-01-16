const express = require("express");
const applicationController = require("./../controllers/applicationController");
const { uploadApplicationResume } = require("./../utils/applicationUpload");

const router = express.Router({ mergeParams: true });

router.post(
  "/",
  uploadApplicationResume.single("resume"),
  applicationController.createApplication
);

module.exports = router;
