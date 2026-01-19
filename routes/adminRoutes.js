const express = require("express");
const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo("ADMIN"));

router.get("/users", adminController.getAllUsers);
router.get("/companies", adminController.getAllCompanies);
router.get("/jobs", adminController.getAllJobs);
router.get("/applications", adminController.getAllApplications);

module.exports = router;
