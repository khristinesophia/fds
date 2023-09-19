const express = require('express')
const router = express.Router()
const pool = require('../../../config/db-config')

const isAuthenticated = require('../../../middleware/isAuthenticated')


// read
router.get('/', isAuthenticated, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const hotel = await pool.query('SELECT * FROM hotels WHERE hotelid = $1', [hotelid])

        res.render('HA/profile/profile', {
            h: hotel.rows[0]
        })

    } catch (error) {
        console.error(error.message)
    }
})


// render edit page
router.get('/editprofile', isAuthenticated, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const hotel = await pool.query('SELECT * FROM hotels WHERE hotelid = $1', [hotelid])

        res.render('HA/profile/editprofile', {
            h: hotel.rows[0]
        })
        
    } catch (error) {
        console.error(error.message)
    }
})
// edit
router.post('/', isAuthenticated, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const { hotelname, hotellocation, hotelcontact, hotelemail } = req.body
        
        const editHotel = await pool.query(`UPDATE hotels 
            SET hotelname = $1, hotellocation = $2, hotelcontact = $3, hotelemail = $4
            WHERE hotelid = $5`,
            [hotelname, hotellocation, hotelcontact, hotelemail, hotelid]
        )

        res.redirect('/profile')
    } catch (error) {
        console.error(error.message)
    }
})


module.exports = router