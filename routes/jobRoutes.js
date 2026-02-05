const express = require("express");
const jobController = require("./../controllers/jobController");

const router = express.Router({ mergeParams: true });

router.get("/search", jobController.searchJobs);

router.get("/", jobController.getAllJobs);
router.get("/:id", jobController.getJob);

router.get("/company/:companyId", jobController.getJobsByCompany);

router.post("/", jobController.createJob);
router.patch("/:id", jobController.updateJob);
router.patch("/:id/close", jobController.closeJob);

module.exports = router;
