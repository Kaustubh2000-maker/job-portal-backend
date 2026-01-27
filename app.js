const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const globalErrorHandler = require("./controllers/errorController");
const jobSeekerRouter = require("./routes/jobseekerRoutes");
const companyRouter = require("./routes/companyRoutes");
const companyUserRouter = require("./routes/companyUserRoutes");
const jobRouter = require("./routes/jobRoutes");
const applicationRouter = require("./routes/applicationRoutes");
const app = express();
const userRouter = require("./routes/userRoutes");
const cookieParser = require("cookie-parser");
const path = require("path");
const searchRoutes = require("./routes/searchRoutes");

const adminRoutes = require("./routes/adminRoutes");
const corsOptions = {
  origin: "http://localhost:5173", // EXACT frontend URL
  credentials: true, // allow cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// serve uploaded files
app.use("/files", express.static(path.join(__dirname, "files")));

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Job Portal API is running",
  });
});

app.use("/files", express.static("files"));
app.use("/api/v1/users", userRouter);
app.use("/api/v1/jobseekers", jobSeekerRouter);
app.use("/api/v1/companies", companyRouter);
app.use("/api/v1/company-users", companyUserRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/applications", applicationRouter);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/search", searchRoutes);

app.use(globalErrorHandler);

module.exports = app;
