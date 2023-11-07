const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const fs = require('fs')
const multer = require('multer')

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))


// read all rooms
router.get('/', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const roomtype = await pool.query('SELECT * FROM room_type WHERE hotelid = $1 ORDER BY price ASC', [hotelid])
       
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

        res.render('HSA/HSArooms/allRooms', {
            roomTypesArray: roomtype.rows, 
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

        res.render('HSA/HSArooms/vacantRooms', {
            roomTypesArray: roomtype.rows, 
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

        res.render('HSA/HSArooms/reservedRooms', {
            roomTypesArray: roomtype.rows, 
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

        res.render('HSA/HSArooms/occupiedRooms', {
            roomTypesArray: roomtype.rows, 
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
                r.hotelid = $1 AND status = $2 ORDER BY roomnum ASC;
        `;

        const onchangeRooms = await pool.query(onchangeRoomsQuery, [hotelid, 'On-Change'])

        // Convert binary data to base64 string
        onchangeRooms.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });

        res.render('HSA/HSArooms/onchangeRooms', {
            roomTypesArray: roomtype.rows, 
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

        res.render('HSA/HSArooms/outoforderRooms', {
            roomTypesArray: roomtype.rows, 
            outoforderRoomsArray: outoforderRooms.rows,
            hotelColor: req.hotelColor
        })

    } catch (error) {
        console.error(error.message)
    }
})

//view add rooms form
router.get('/addRooms', isAuthenticated, getHotelColor, async(req, res) => {
    try {
        const hotelid = req.session.hotelID
        const roomtype = await pool.query('SELECT * FROM room_type WHERE hotelid = $1', [hotelid])
        
        res.render('HSA/HSArooms/addRooms', {
            roomTypesArray: roomtype.rows, 
            hotelColor: req.hotelColor  
        });
    } catch (error) {
        console.error(error.message);
    }
});

//add rooms
router.post('/addRooms', isAuthenticated, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID;
        const { roomnum, roomtype, roomprice, roomfloor, capacity } = req.body;
        const status = 'Vacant'; // Set the default status to "Vacant"

        //check if the roomnum already exists in the database
        const existingRoom = await pool.query('SELECT roomnum FROM rooms WHERE hotelid = $1 AND roomnum = $2', [hotelid, roomnum]);

        if (existingRoom.rows.length > 0) {
            res.status(401).send('The Room Number already exists. Please select different Room Number');
        }

        //get the typeid of the roomtype
        const typeidResult = await pool.query('SELECT typeid FROM room_type WHERE hotelid = $1 AND roomtype = $2', [hotelid, roomtype]);

        if (typeidResult.rows.length > 0) {
            const typeid = typeidResult.rows[0].typeid;
        
            const addRooms = await pool.query(
                'INSERT INTO rooms (hotelid, roomnum, typeid, roomfloor, status) VALUES ($1, $2, $3, $4, $5)',
                [hotelid, roomnum, typeid, roomfloor, status]
            );
          console.log("Room Successfully Added!");
          res.redirect('/HSArooms');
        }else {
            res.status(400).send('The selected room type does not exist.');
        }

    } catch (error) {
        console.error(error.message)
    }
})

// delete room
router.post('/delete/:id', isAuthenticated, async(req,res)=>{
    try {
        const { id } = req.params
        const hotelid = req.session.hotelID

        const deleteSuperAdmin = await pool.query('DELETE FROM rooms WHERE roomnum = $1 AND hotelid = $2', [id, hotelid])
        console.log(`Room Number ${id} Successfully Deleted!`);
        res.redirect('/HSArooms')
    } catch (error) {
        console.error(error.message)
    }
})


module.exports = router