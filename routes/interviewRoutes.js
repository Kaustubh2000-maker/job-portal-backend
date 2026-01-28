const express = require("express");
const interviewController = require("../controllers/interviewController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.post("/schedule", interviewController.scheduleInterview);

router.get(
  "/jobseeker/:jobSeekerId",
  interviewController.getJobSeekerInterviews
);

router.get("/company/:companyId", interviewController.getCompanyInterviews);

module.exports = router;
