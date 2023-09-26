const multer = require('multer')

const storage = multer.diskStorage({
    destination: 'public/images/hotellogos',
    filename: function(req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
const upload = multer({ storage: storage })

module.exports = upload