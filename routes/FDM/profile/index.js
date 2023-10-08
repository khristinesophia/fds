const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))




// read profile
router.get('/', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const hotel = await pool.query('SELECT * FROM hotels WHERE hotelid = $1', [hotelid])

        // Convert binary data to base64 string
        hotel.rows.forEach(row => {
            if (row.hotelimage) {
                row.hotelimage = 'data:' + row.imagetype + ';base64,' + row.hotelimage.toString('base64')
            }
        })

        res.render('FDM/profile/profile', {
            h: hotel.rows[0],
            hotelColor: req.hotelColor
        })

    } catch (error) {
        console.error(error.message)
    }
})


// render edit profile
router.get('/editprofile', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const hotel = await pool.query('SELECT * FROM hotels WHERE hotelid = $1', [hotelid])
        const colors = await pool.query('SELECT * FROM colorstack')

        res.render('FDM/profile/editprofile', {
            h: hotel.rows[0],
            hotelColor: req.hotelColor,
            colorStacksArray: colors.rows
        })
        
    } catch (error) {
        console.error(error.message)
    }
})
// edit
router.post('/', isAuthenticated, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const { hotelname, hotellocation, hotelcontact, hotelemail, hotelcolor } = req.body
        
        const editHotel = await pool.query(`UPDATE hotels 
            SET hotelname = $1, hotellocation = $2, hotelcontact = $3, hotelemail = $4, hotelcolor = $5
            WHERE hotelid = $6`,
            [hotelname, hotellocation, hotelcontact, hotelemail, hotelcolor, hotelid]
        )

        res.redirect('/profile')
    } catch (error) {
        console.error(error.message)
    }
})




module.exports = router