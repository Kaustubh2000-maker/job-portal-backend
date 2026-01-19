const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name"],
  },

  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },

  mobile: {
    type: String,
    required: [true, "Please provide your mobile number"],
  },

  role: {
    type: String,
    enum: ["JOBSEEKER", "COMPANY", "ADMIN"],
    required: true,
  },

  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, "Please confirm a password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not same !!!",
    },
  },

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

// userSchema.pre("save", function (next) {
//   if (!this.isModified("password") || this.isNew) return next();

//   this.passwordChangedAt = Date.now() - 1000;

//   next();
// });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  // next(); // giving error while sign in so commented
});

userSchema.methods.changedPassowordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
