const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))


// read all rooms
router.get('/', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const allRooms = await pool.query('SELECT roomnum, roomtype, roomfloor, status FROM rooms WHERE hotelid = $1', [hotelid])

        res.render('HA/rooms/allRooms', {
            allRoomsArray: allRooms.rows,
            hotelColor: req.hotelColor
        })

    } catch (error) {
        console.error(error.message)
    }
})

//read all vacant rooms
router.get('/vacantRooms', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        
        const vacantRooms = await pool.query('SELECT roomnum, roomtype, roomfloor, roomprice, capacity, status FROM rooms WHERE hotelid = $1 AND status = $2', [hotelid, 'Vacant']);


        res.render('HA/rooms/vacantRooms', {
            vacantRoomsArray: vacantRooms.rows,
            hotelColor: req.hotelColor
        })

    } catch (error) {
        console.error(error.message)
    }
})

//read all occupied rooms
router.get('/occupiedRooms', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID

        // Updated SQL query to fetch occupied rooms with guest details
        const occupiedRoomsQuery = `
            SELECT
                r.roomnum,
                r.roomtype,
                r.roomfloor,
                gd.fullname,
                TO_CHAR(ga.checkindate, 'YYYY-MM-DD') AS checkindate,
                TO_CHAR(ga.checkoutdate, 'YYYY-MM-DD') AS checkoutdate,
                r.status
            FROM
                rooms r
            INNER JOIN
                guestaccounts ga ON r.roomnum = ga.roomnum
            INNER JOIN
                guestaccounts_guestdetails gd ON ga.accountid = gd.accountid
            WHERE
                r.hotelid = $1 AND r.status = $2;
        `;

        const occupiedRooms = await pool.query(occupiedRoomsQuery, [hotelid, 'Occupied'])

        res.render('HA/rooms/occupiedRooms', {
            occupiedRoomsArray: occupiedRooms.rows,
            hotelColor: req.hotelColor
        })

    } catch (error) {
        console.error(error.message)
    }
})

//read all on-change rooms
router.get('/onchangeRooms', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const onchangeRooms = await pool.query('SELECT roomnum, roomtype, roomfloor, status FROM rooms WHERE hotelid = $1 AND status = $2', [hotelid, 'On-Change'])

        res.render('HA/rooms/onchangeRooms', {
            onchangeRoomsArray: onchangeRooms.rows,
            hotelColor: req.hotelColor
        })

    } catch (error) {
        console.error(error.message)
    }
})

//read all out-of-order rooms
router.get('/outoforderRooms', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const outoforderRooms = await pool.query('SELECT roomnum, roomtype, roomfloor, status FROM rooms WHERE hotelid = $1 AND status = $2', [hotelid, 'Out-of-Order'])

        res.render('HA/rooms/outoforderRooms', {
            outoforderRoomsArray: outoforderRooms.rows,
            hotelColor: req.hotelColor
        })

    } catch (error) {
        console.error(error.message)
    }
})

//add rooms



//add room types




module.exports = router