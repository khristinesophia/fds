const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const fs = require('fs')
const multer = require('multer')

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const upload = multer({ dest: 'uploads/' })




// render setup page
router.get('/', isAuthenticated, async(req, res)=>{
    const hotelid = req.session.hotelID

    const hotel = await pool.query('SELECT * FROM hotels WHERE hotelid = $1', [hotelid])
    const colors = await pool.query('SELECT * FROM colorstack')

    res.render('HSA/setup/setup', {
        h: hotel.rows[0],
        colorStacksArray: colors.rows
    })
})


// setup
router.post('/', isAuthenticated, upload.single('hotelimage'), async(req, res)=>{
    const hotelid = req.session.hotelID

    const { hotelcolor } = req.body
    const hotelimage = fs.readFileSync(req.file.path)
    // const filepath = '/images/hotellogos/' + req.file.originalname

    const editHotel = await pool.query('UPDATE hotels SET hotelcolor = $1, hotelimage = $2 WHERE hotelid = $3',
        [hotelcolor, hotelimage, hotelid]
    )

    await pool.query('UPDATE hoteladmin_login SET firstlogin = $1 WHERE hotelid = $2',
        ['true', hotelid]
    )

    res.redirect('/profile')
})




module.exports = router