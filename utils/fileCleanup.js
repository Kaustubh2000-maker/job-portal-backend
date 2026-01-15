const fs = require("fs");

exports.deleteFiles = (files) => {
  if (!files) return;

  Object.values(files)
    .flat()
    .forEach((file) => {
      fs.unlink(file.path, (err) => {
        if (err) console.error("File delete failed:", err.message);
      });
    });
};
