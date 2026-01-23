const mongoose = require("mongoose");

const companyUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    role: {
      type: String,
      enum: ["OWNER", "HR"],
      default: "HR",
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

companyUserSchema.index({ user: 1, company: 1 }, { unique: true });

const CompanyUser = mongoose.model("CompanyUser", companyUserSchema);
module.exports = CompanyUser;
