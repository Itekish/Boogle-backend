// middleware/uploadImage.js
const multer = require("multer");

// keep the uploaded file in RAM, not on disk
const storage = multer.memoryStorage();
module.exports = multer({ storage }).single("image");
//                  ↑ matches <input name="image" type="file" />
