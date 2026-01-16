const express = require("express");
const jobController = require("./../controllers/jobController");

const router = express.Router({ mergeParams: true });

/* PUBLIC */
router.get("/", jobController.getAllJobs);
router.get("/:id", jobController.getJob);

/* COMPANY */
router.post("/", jobController.createJob);
router.patch("/:id", jobController.updateJob);
router.patch("/:id/close", jobController.closeJob);

module.exports = router;
