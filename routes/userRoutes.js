const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router({ mergeParams: true });

router.post("/register", userController.registerUser);

router.route("/:id").patch(userController.updateUser);
//   .put(userController.updateUser);

router.patch("/deactivate/:id", userController.deactivateUser);

router.delete("/:id", userController.deleteUser);

module.exports = router;
