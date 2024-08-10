const multer = require('multer');

/* The disk storage engine gives you full control on storing files to disk. */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage }) // Destination of Directory where File is saved


module.exports = upload;