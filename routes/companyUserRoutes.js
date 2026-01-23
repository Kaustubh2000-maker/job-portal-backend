const express = require("express");
const companyUserController = require("./../controllers/companyUserController");
const authController = require("./../controllers/authController");

const router = express.Router({ mergeParams: true });

router.get(
  "/check",
  authController.protect,
  companyUserController.checkCompanyUserExistence
);

router.post("/apply", companyUserController.applyToCompany);
router.get("/pending/:companyId", companyUserController.getPendingCompanyUsers);
router.patch("/:companyUserId", companyUserController.updateCompanyUserStatus);

module.exports = router;
