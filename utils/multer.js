const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profilePhoto") {
      cb(null, "files/jobseeker/photo");
    } else if (file.fieldname === "resume") {
      cb(null, "files/jobseeker/resume");
    }
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profilePhoto" && file.mimetype.startsWith("image")) {
    cb(null, true);
  } else if (
    file.fieldname === "resume" &&
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;
