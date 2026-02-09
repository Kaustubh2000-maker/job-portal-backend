const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const loginLimiter = require("./../limiter/loginLimiter");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", loginLimiter, authController.login);
router.get("/logout", authController.logout);

router.use(authController.protect);

router.patch("/updateMe", userController.updateMe);
router.delete("/deactivateMe", userController.deactivateMe);

router.use(authController.restrictTo("ADMIN"));

router
  .route("/:id")
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.patch("/deactivate/:id", userController.deactivateUser);

module.exports = router;
