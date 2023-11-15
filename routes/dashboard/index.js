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
// Assuming this is your existing code for the /receptionist route
router.get('/receptionist', isAuthenticated, getHotelColor, getHotelLogo, async (req, res) => {
    const hotelid = req.session.hotelID;

    // Query to get the count of active guest accounts
    const activeCount = `
        SELECT COUNT(*) FROM guestaccounts WHERE hotelid = $1
    `;
    try {
        const countResult = await pool.query(activeCount, [hotelid]);
        const guestCount = countResult.rows[0].count; // Assuming COUNT(*) returns a count property

        // Query to get the count of vacant rooms
        const vacantRoomsCountQuery = `
            SELECT COUNT(*) FROM rooms WHERE hotelid = $1 AND status = $2
        `;

        const vacantRoomsCountResult = await pool.query(vacantRoomsCountQuery, [hotelid, 'Vacant']);
        const vacantRoomsCount = vacantRoomsCountResult.rows[0].count;

        // Query to get the list of vacant rooms
        const vacantRoomsQuery = `
            SELECT
                r.roomnum,
                rt.roomimage,
                rt.roomtype,
                r.roomfloor,
                rt.price,
                rt.capacity,
                r.status
            FROM
                rooms r
            INNER JOIN
                room_type rt ON r.typeid = rt.typeid
            WHERE
                r.hotelid = $1 AND status = $2 ORDER BY roomnum ASC;
        `;

        const vacantRooms = await pool.query(vacantRoomsQuery, [hotelid, 'Vacant']);

        // Convert binary data to base64 string
        vacantRooms.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });

        res.render('dashboard/receptionist', {
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage,
            guestCount: guestCount, // Pass the count to the dashboard template
            vacantRoomsCount: vacantRoomsCount, // Pass the count of vacant rooms to the dashboard template
            vacantRoomsArray: vacantRooms.rows // Pass the list of vacant rooms to the dashboard template
        });
    } catch (error) {
        console.error("Error fetching data for the receptionist dashboard", error);
        res.sendStatus(500); // or render an error page, handle as needed
    }
});








module.exports = router