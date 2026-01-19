const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

/* =====================
   JWT HELPERS
===================== */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

/* =====================
   SIGNUP
===================== */
exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, mobile, password, passwordConfirm, role } = req.body;

  const user = await User.create({
    name,
    email,
    mobile,
    password,
    passwordConfirm,
    role,
  });

  sendToken(user, 201, res);
});

/* =====================
   LOGIN
===================== */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

/* =====================
   LOGOUT
===================== */
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: "success" });
};

/* =====================
   PROTECT (AUTH GUARD)
===================== */
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  //   if (
  //     req.headers.authorization &&
  //     req.headers.authorization.startsWith("Bearer")
  //   ) {
  //     token = req.headers.authorization.split(" ")[1];
  //   }
  //  Cmmenting for now
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("You are not logged in", 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("User belonging to this token no longer exists", 401)
    );
  }

  if (currentUser.changedPassowordAfter(decoded.iat)) {
    return next(
      new AppError("Password changed recently. Please login again.", 401)
    );
  }

  req.user = currentUser;
  next();
});

/* =====================
   ROLE RESTRICTION
===================== */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};
