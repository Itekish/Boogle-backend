const multer = require('multer');
const path = require('path');
const DataUri = require('datauri/parser');

const storage = multer.memoryStorage();

const imageUploads = multer({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    },
    
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: File upload only supports the following filetypes - " + filetypes);
    },
}).single("image");

const dUri = new DataUri();

const dataUri = (req) => 
    dUri.format(path.extname(req.file.originalname).toString(), req.file.buffer);

module.exports = { dataUri, imageUploads}