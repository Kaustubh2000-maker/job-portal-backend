// // const express = require("express");
// // const userController = require("../controllers/userController");

// // const router = express.Router({ mergeParams: true });

// // router.post("/register", userController.registerUser);

// // router.route("/:id").patch(userController.updateUser);
// // //   .put(userController.updateUser);

// // router.patch("/deactivate/:id", userController.deactivateUser);

// // router.delete("/:id", userController.deleteUser);

// // module.exports = router;

// const express = require("express");
// const authController = require("../controllers/authController");
// const userController = require("../controllers/userController");

// const router = express.Router();

// //    AUTH ROUTES

// router.post("/signup", authController.signup);
// router.post("/login", authController.login);
// router.get("/logout", authController.logout);

// //    PROTECTED ROUTES

// router.use(authController.protect);

// /* logged-in user */
// // router.get("/me", userController.getMe, userController.getUser);
// router.patch("/updateMe", userController.updateMe);
// // router.patch("/updateMyPassword", authController.updatePassword);
// router.delete("/deactivateMe", userController.deactivateMe);

// /* =====================
//    ADMIN ONLY
// ===================== */
// router.use(authController.restrictTo("ADMIN"));

// // router.route("/").get(userController.getAllUsers);

// router
//   .route("/:id")
//   .patch(userController.updateUser)
//   .delete(userController.deleteUser);

// router.patch("/deactivate/:id", userController.deactivateUser);

// module.exports = router;

const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();

/* =====================
   AUTH ROUTES (WORKING)
===================== */
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

/* =====================
   PROTECTED ROUTES
===================== */
router.use(authController.protect);

/* Logged-in user actions */
router.patch("/updateMe", userController.updateMe);
router.delete("/deactivateMe", userController.deactivateMe);

/* =====================
   ADMIN ROUTES
===================== */
router.use(authController.restrictTo("ADMIN"));

router
  .route("/:id")
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.patch("/deactivate/:id", userController.deactivateUser);

module.exports = router;
