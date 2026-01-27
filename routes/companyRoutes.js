const express = require("express");
const companyController = require("../controllers/companyController");

const authController = require("./../controllers/authController");

const router = express.Router();
router.get("/search", companyController.getCompanies);

router
  .route("/")
  .post(companyController.createCompany)
  .get(companyController.getAllCompanies);

router.use(authController.protect);
router.get("/mycompany", companyController.getMyCompany);

router
  .route("/:id")
  .get(companyController.getCompany)
  .patch(companyController.updateCompany)
  .delete(companyController.deleteCompany);

/* Get company created by logged-in user */

module.exports = router;
