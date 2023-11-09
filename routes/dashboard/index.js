//- path import
const path = require('path')

//- express and router
const express = require('express')
const { type } = require('os')
const router = express.Router()

//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- middlewares
const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))
const getHotelLogo = require(path.join(__basedir, 'middleware', 'getHotelLogo'))



// render HA dashboard
router.get('/hsadmin', isAuthenticated, getHotelColor, getHotelLogo, async(req,res)=>{

    res.render('dashboard/hsadmin',{
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage
    })
})

// render R dashboard
// render R dashboard
router.get('/receptionist', isAuthenticated, getHotelColor, getHotelLogo, async (req, res) => {
    const hotelid = req.session.hotelID

    // Query to get the count of active guest accounts
    const qCount = `
        SELECT COUNT(*) FROM guestaccounts WHERE hotelid = $1
    `;
    try {
        const countResult = await pool.query(qCount, [hotelid]);
        const guestCount = countResult.rows[0].count; // Assuming COUNT(*) returns a count property

        res.render('dashboard/receptionist', {
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage,
            guestCount: guestCount // Pass the count to the dashboard template
        });
    } catch (error) {
        console.error("Error fetching guest count", error);
        res.sendStatus(500); // or render an error page, handle as needed
    }
});







module.exports = router