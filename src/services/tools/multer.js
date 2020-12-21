const 
    multer  = require('multer'),
    storage = multer.diskStorage({
        destination: './files/uploads/',
    });

module.exports = {
    upload: multer({
        storage: storage,
        fileFilter: function(req, file, cb) {
            const mimetype = file.mimetype
            if (mimetype !== 'text/plain' && mimetype !== 'application/json') return cb(null, false)
            return cb(null, true)
        },
        limits: {
            fields: 0,
            fileSize: 1000000,
            files: 1,
            parts: 1,
            headerPairs: 0,
        },
    })
}