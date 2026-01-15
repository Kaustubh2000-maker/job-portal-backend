const express = require("express");
const companyController = require("../controllers/companyController");

const router = express.Router();

router
  .route("/")
  .post(companyController.createCompany)
  .get(companyController.getAllCompanies);

router
  .route("/:id")
  .get(companyController.getCompany)
  .patch(companyController.updateCompany)
  .delete(companyController.deleteCompany);

module.exports = router;
