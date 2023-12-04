const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))


const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))
const getHotelLogo = require(path.join(__basedir, 'middleware', 'getHotelLogo'))

// read room type
router.get('/', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
       
        const allRoomtypeQuery = `
            SELECT * FROM hist_room_type
            WHERE hotelid = $1 ORDER BY typeid ASC;
        `

        const allRoomtype = await pool.query(allRoomtypeQuery, [hotelid])

        // Convert binary data to base64 string
        allRoomtype.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });

        res.render('HSA/archived/arcRoomtype', {
            allRoomtypeArray: allRoomtype.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})


// read rooms
router.get('/arcRooms', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
       
        const allRoomsQuery = `
            SELECT r.roomid, r.roomnum, r.roomtype, roomfloor, rt.roomimage FROM hist_rooms r
            JOIN room_type rt ON r.roomtype = rt.roomtype
            WHERE r.hotelid = $1 ORDER BY roomnum ASC;
        `

        const allRooms = await pool.query(allRoomsQuery, [hotelid])

        // Convert binary data to base64 string
        allRooms.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });

        res.render('HSA/archived/arcRooms', {
            allRoomsArray: allRooms.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})


// read promos
router.get('/arcPromos', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
       
        const allPromosQuery = `
            SELECT * FROM hist_promos
            WHERE hotelid = $1 ORDER BY id ASC;
        `

        const allPromos = await pool.query(allPromosQuery, [hotelid])

        // Convert binary data to base64 string
        allPromos.rows.forEach(row => {
            if (row.poster) {
                row.poster = 'data:' + row.poster + ';base64,' + row.poster.toString('base64');
            }
        });

        res.render('HSA/archived/arcPromos', {
            allPromosArray: allPromos.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})


// read users
router.get('/arcUsers', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
       
        const allUsersQuery = `
            SELECT * FROM hist_users
            WHERE hotelid = $1 ORDER BY userid ASC;
        `

        const allUsers = await pool.query(allUsersQuery, [hotelid])

        res.render('HSA/archived/arcUsers', {
            allUsersArray: allUsers.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})

module.exports = router