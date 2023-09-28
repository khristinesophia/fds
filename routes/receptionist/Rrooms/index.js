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
        const allRooms = await pool.query('SELECT roomnum, roomtype, roomfloor, status FROM rooms WHERE hotelid = $1 ORDER BY roomnum ASC' , [hotelid])

        res.render('receptionist/Rrooms/allRooms', {
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
        
        const vacantRooms = await pool.query('SELECT roomnum, roomtype, roomfloor, roomprice, capacity, status FROM rooms WHERE hotelid = $1 AND status = $2 ORDER BY roomnum ASC', [hotelid, 'Vacant']);


        res.render('receptionist/Rrooms/vacantRooms', {
            vacantRoomsArray: vacantRooms.rows,
            hotelColor: req.hotelColor
        })

    } catch (error) {
        console.error(error.message)
    }
})

//read all reserved rooms
router.get('/reservedRooms', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID

        // Updated SQL query to fetch occupied rooms with guest details
        const reservedRoomsQuery = `
            SELECT
                r.reservationid,
                r.roomnum,
                r.roomtype,
                rd.fullname,
                TO_CHAR(r.reservationdate, 'YYYY-MM-DD') AS reservationdate,
                TO_CHAR(r.checkindate, 'YYYY-MM-DD HH:MI:SS') AS checkindate,
                TO_CHAR(r.checkoutdate, 'YYYY-MM-DD HH:MI:SS') AS checkoutdate
            FROM
                reservations r
            INNER JOIN
                reservation_guestdetails rd ON r.reservationid = rd.reservationid
            WHERE
                r.hotelid = $1 ORDER BY roomnum ASC;
        `;

        const reservedRooms = await pool.query(reservedRoomsQuery, [hotelid])

        res.render('receptionist/Rrooms/reservedRooms', {
            reservedRoomsArray: reservedRooms.rows,
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
                TO_CHAR(ga.checkindate, 'YYYY-MM-DD HH:MI:SS') AS checkindate,
                TO_CHAR(ga.checkoutdate, 'YYYY-MM-DD HH:MI:SS') AS checkoutdate,
                r.status
            FROM
                rooms r
            INNER JOIN
                guestaccounts ga ON r.roomnum = ga.roomnum
            INNER JOIN
                guestaccounts_guestdetails gd ON ga.accountid = gd.accountid
            WHERE
                r.hotelid = $1 AND r.status = $2 ORDER BY roomnum ASC;
        `;

        const occupiedRooms = await pool.query(occupiedRoomsQuery, [hotelid, 'Occupied'])

        res.render('receptionist/Rrooms/occupiedRooms', {
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
        const onchangeRooms = await pool.query('SELECT roomnum, roomtype, roomfloor, status FROM rooms WHERE hotelid = $1 AND status = $2 ORDER BY roomnum ASC', [hotelid, 'On-Change'])

        res.render('receptionist/Rrooms/onchangeRooms', {
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
        const outoforderRooms = await pool.query('SELECT roomnum, roomtype, roomfloor, status FROM rooms WHERE hotelid = $1 AND status = $2 ORDER BY roomnum ASC', [hotelid, 'Out-of-Order'])

        res.render('receptionist/Rrooms/outoforderRooms', {
            outoforderRoomsArray: outoforderRooms.rows,
            hotelColor: req.hotelColor
        })

    } catch (error) {
        console.error(error.message)
    }
})


module.exports = router