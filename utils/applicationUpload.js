const multer = require("multer");
const path = require("path");
const fs = require("fs");

const resumeDir = "files/applications/resumes";
fs.mkdirSync(resumeDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumeDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files allowed"), false);
  }
};

exports.uploadApplicationResume = multer({
  storage,
  fileFilter,
});
