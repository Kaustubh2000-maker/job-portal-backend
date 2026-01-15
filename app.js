const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const globalErrorHandler = require("./controllers/errorController");
const jobSeekerRouter = require("./routes/jobseekerRoutes");
const companyRouter = require("./routes/companyRoutes");

const app = express();
const userRouter = require("./routes/userRoutes");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use(globalErrorHandler);

module.exports = app;
