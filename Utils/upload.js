/* const multer = require("multer")
const storage = multer.diskStorage({
  //Specify the destination directory where the file needs to be saved
  destination: function (req, file, cb) {
    cb(null, "./uploads")
  },
  //Specify the name of the file. The date is prefixed to avoid overwriting of files.
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname)
  },
})

const upload = multer({
  storage: storage,
})

module.exports = upload */
