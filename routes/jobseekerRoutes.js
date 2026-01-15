const express = require("express");
const jobSeekerController = require("./../controllers/jobseekerController");
const upload = require("../utils/multer");

const router = express.Router();

console.log("");

router.post(
  "/",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  jobSeekerController.createJobSeekerProfile
);

router.patch(
  "/:userId",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  jobSeekerController.updateJobSeekerProfile
);

router.get("/:userId", jobSeekerController.getJobSeekerProfile);

module.exports = router;
