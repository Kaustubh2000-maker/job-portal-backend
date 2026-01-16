const express = require("express");
const companyUserController = require("./../controllers/companyUserController");
const router = express.Router({ mergeParams: true });

router.post("/apply", companyUserController.applyToCompany);
router.get("/pending/:companyId", companyUserController.getPendingCompanyUsers);
router.patch("/:companyUserId", companyUserController.updateCompanyUserStatus);

module.exports = router;
