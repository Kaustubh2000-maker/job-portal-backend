const User = require("./../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// exports.registerUser = catchAsync(async (req, res, next) => {
//   //  required fields
//   const { name, email, mobile, password, passwordConfirm, role } = req.body;

//   if (!name || !email || !mobile || !password || !role) {
//     return next(new AppError("All fields are required", 400));
//   }

//   // Prevent admin registration
//   if (role === "ADMIN") {
//     return next(new AppError("Admin cannot be registered", 403));
//   }

//   // if user already exists
//   const existingUser = await User.findOne({ email });
//   if (existingUser) {
//     return next(new AppError("User already exists with this email", 409));
//   }

//   // Create user

//   const user = await User.create({
//     name,
//     email,
//     mobile,
//     password,
//     passwordConfirm, // ✅ MUST be passed for validation
//     role,
//   });

//   //  Send response
//   res.status(201).json({
//     status: "success",
//     data: {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     },
//   });
// });

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    runValidators: true,
    new: true,
  });

  console.log(user);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

////////////////
//permenat delete
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ///////////////////////
exports.deactivateUser = catchAsync(async (req, res, next) => {
  const { active } = req.body;

  if (typeof active !== "boolean") {
    return next(
      new AppError("Please provide active status (true or false)", 400)
    );
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active },
    { new: true }
  );

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    message: `User ${active ? "activated" : "deactivated"} successfully`,
  });
});

// /////////////////////////////////////////////
// ////// after auth user own

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deactivateMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const allowedFields = ["name", "mobile", "email"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: { user },
  });
});
