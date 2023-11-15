const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))
const getHotelLogo = require(path.join(__basedir, 'middleware', 'getHotelLogo'))


// read all rooms
router.get('/', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const roomtype = await pool.query('SELECT * FROM room_type WHERE hotelid = $1', [hotelid])
       
        const allRoomsQuery = `
            SELECT
                r.roomnum,
                rt.roomimage,
                rt.roomtype,
                r.roomfloor,
                r.status
            FROM
                rooms r
            INNER JOIN
                room_type rt ON r.typeid = rt.typeid
            WHERE
                r.hotelid = $1 ORDER BY roomnum ASC;
        `

        const allRooms = await pool.query(allRoomsQuery, [hotelid])

        // Convert binary data to base64 string
        allRooms.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });
        
        res.render('receptionist/Rrooms/allRooms', {
            roomTypesArray: roomtype.rows, 
            allRoomsArray: allRooms.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})

//read all vacant rooms
router.get('/vacantRooms', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID

        const roomtype = await pool.query('SELECT * FROM room_type WHERE hotelid = $1', [hotelid])

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

        const vacantRooms = await pool.query(vacantRoomsQuery, [hotelid, 'Vacant'])

        // Convert binary data to base64 string
        vacantRooms.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });

        res.render('receptionist/Rrooms/vacantRooms', {
            roomTypesArray: roomtype.rows, 
            vacantRoomsArray: vacantRooms.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})

//read all reserved rooms
router.get('/reservedRooms', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID

        const roomtype = await pool.query('SELECT * FROM room_type WHERE hotelid = $1', [hotelid])

        // Updated SQL query to fetch occupied rooms with guest details
        const reservedRoomsQuery = `
            SELECT
                r.reservationid,
                ro.roomnum,
                rt.roomimage,
                rt.roomtype,
                rd.fullname,
                TO_CHAR(r.reservationdate, 'YYYY-MM-DD') AS reservationdate,
                TO_CHAR(r.checkindate, 'YYYY-MM-DD HH:MI:SS') AS checkindate,
                TO_CHAR(r.checkoutdate, 'YYYY-MM-DD HH:MI:SS') AS checkoutdate
            FROM
                reservations r
            INNER JOIN
                reservation_guestdetails rd ON r.reservationid = rd.reservationid
            INNER JOIN
                room_type rt ON r.typeid = rt.typeid
            INNER JOIN
                rooms ro ON r.roomid = ro.roomid
            WHERE
                r.hotelid = $1 ORDER BY roomnum ASC;
        `;

        const reservedRooms = await pool.query(reservedRoomsQuery, [hotelid])

        // Convert binary data to base64 string
        reservedRooms.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });

        res.render('receptionist/Rrooms/reservedRooms', {
            roomTypesArray: roomtype.rows, 
            reservedRoomsArray: reservedRooms.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})

//read all occupied rooms
router.get('/occupiedRooms', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID

        const roomtype = await pool.query('SELECT * FROM room_type WHERE hotelid = $1', [hotelid])

        // Updated SQL query to fetch occupied rooms with guest details
        const occupiedRoomsQuery = `
            SELECT
                r.roomnum,
                rt.roomimage,
                rt.roomtype,
                r.roomfloor,
                gd.fullname,
                TO_CHAR(ga.checkindate, 'YYYY-MM-DD HH:MI:SS') AS checkindate,
                TO_CHAR(ga.checkoutdate, 'YYYY-MM-DD HH:MI:SS') AS checkoutdate,
                r.status
            FROM
                rooms r
            INNER JOIN
                guestaccounts ga ON r.roomid = ga.roomid
            INNER JOIN
                guestaccounts_guestdetails gd ON ga.accountid = gd.accountid
            INNER JOIN
                room_type rt ON r.typeid = rt.typeid
            WHERE
                r.hotelid = $1 AND r.status = $2 ORDER BY roomnum ASC;
        `;

        const occupiedRooms = await pool.query(occupiedRoomsQuery, [hotelid, 'Occupied'])

        // Convert binary data to base64 string
        occupiedRooms.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });

        res.render('receptionist/Rrooms/occupiedRooms', {
            roomTypesArray: roomtype.rows, 
            occupiedRoomsArray: occupiedRooms.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})

//read all on-change rooms
router.get('/onchangeRooms', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID

        const roomtype = await pool.query('SELECT * FROM room_type WHERE hotelid = $1', [hotelid])

        const onchangeRoomsQuery = `
            SELECT
                r.roomnum,
                rt.roomimage,
                rt.roomtype,
                r.roomfloor,
                r.status
            FROM
                rooms r
            INNER JOIN
                room_type rt ON r.typeid = rt.typeid
            WHERE
            r.hotelid = $1 AND status = $2 AND status = $3 AND status = $4 AND status = $5 ORDER BY roomnum ASC;
        `;

        const onchangeRooms = await pool.query(onchangeRoomsQuery, [hotelid, 'On-Change', 'To check-out', 'Inspected', 'Recently checked-out'])

        // Convert binary data to base64 string
        onchangeRooms.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });

        res.render('receptionist/Rrooms/onchangeRooms', {
            roomTypesArray: roomtype.rows, 
            onchangeRoomsArray: onchangeRooms.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})

//read all out-of-order rooms
router.get('/outoforderRooms', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID

        const roomtype = await pool.query('SELECT * FROM room_type WHERE hotelid = $1', [hotelid])

        const outoforderRoomsQuery = `
            SELECT
                r.roomnum,
                rt.roomimage,
                rt.roomtype,
                r.roomfloor,
                r.status
            FROM
                rooms r
            INNER JOIN
                room_type rt ON r.typeid = rt.typeid
            WHERE
                r.hotelid = $1 AND status = $2 ORDER BY roomnum ASC;
        `;

        const outoforderRooms = await pool.query(outoforderRoomsQuery, [hotelid, 'Out-of-Order'])

        // Convert binary data to base64 string
        outoforderRooms.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });

        res.render('receptionist/Rrooms/outoforderRooms', {
            roomTypesArray: roomtype.rows, 
            outoforderRoomsArray: outoforderRooms.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})


module.exports = router