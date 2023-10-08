const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const upload = require(path.join(__basedir, 'middleware', 'upload'))




// render setup page
router.get('/', isAuthenticated, async(req, res)=>{
    const hotelid = req.session.hotelID

    const hotel = await pool.query('SELECT * FROM hotels WHERE hotelid = $1', [hotelid])
    const colors = await pool.query('SELECT * FROM colorstack')

    res.render('FDM/setup/setup', {
        h: hotel.rows[0],
        colorStacksArray: colors.rows
    })
})


// setup
router.post('/', isAuthenticated, upload.single('hotellogo'), async(req, res)=>{
    const { hotelcolor } = req.body
    const filepath = '/images/hotellogos/' + req.file.originalname
    const hotelid = req.session.hotelID

    const editHotel = await pool.query('UPDATE hotels SET hotelcolor = $1, hotellogo = $2 WHERE hotelid = $3',
        [hotelcolor, filepath, hotelid]
    )

    const editHotelAdmin = await pool.query('UPDATE hoteladmin_login SET firstlogin = $1 WHERE hotelid = $2',
        ['true', hotelid]
    )

    res.redirect('/profile')
})




module.exports = router