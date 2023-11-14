const path = require('path')

const express = require('express')
const router = express.Router()

const pool = require(path.join(__basedir, 'config', 'db-config'))

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))
const getHotelLogo = require(path.join(__basedir, 'middleware', 'getHotelLogo'))

const formatDate = require(path.join(__basedir, 'utils', 'formatDate'))

const hotelid = 'H0T1L3D7';

//- Route for rendering the view
//router.get('/', async(req, res) => {
//    res.render('receptionist/reservation1/reservation1');
//});

router.get('/', isAuthenticated, getHotelLogo, getHotelColor, async(req, res)=>{
    try {
        const reservationQuery = `
            SELECT
                r.reservationid,
                ro.roomnum,
                rd.fullname,
                TO_CHAR(r.checkindate, 'YYYY-MM-DD') AS checkindate,
                TO_CHAR(r.checkoutdate, 'YYYY-MM-DD') AS checkoutdate
            FROM
                reservations r
            INNER JOIN
                reservation_guestdetails rd ON r.reservationid = rd.reservationid
            INNER JOIN
                rooms ro ON r.roomid = ro.roomid
            WHERE
                r.hotelid = $1;
        `;

        function getRandomColor() {
            const letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
              color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        const allReservation = await pool.query(reservationQuery, [hotelid])

        const events = allReservation.rows.map(reservation => ({
            title: `Name: ${reservation.fullname} - ReservationID: ${reservation.reservationid} | Room: ${reservation.roomnum}`,
            start: `${reservation.checkindate}T00:00:00`, // Include time information
            end: `${reservation.checkoutdate}T23:59:59`, // Include time information
            id: reservation.reservationid,
            color: getRandomColor(),
            allDay: false,
            displayEventTime: false,
        }));

        res.render('receptionist/reservation/reservation', { 
            events: JSON.stringify(events),
            hotelLogo: req.hotelImage,
            hotelColor: req.hotelColor 
        });

    } catch (error) {
        console.error(error.message) 
    }
});


//- render "detail" page
//- "r/:id"
router.get('/detail/:id', isAuthenticated, getHotelLogo, getHotelColor, async(req, res)=>{
    const { id } = req.params

    const q1 = `
        SELECT * FROM reservations r
        JOIN reservation_guestdetails rd
            ON r.reservationid = rd.reservationid
        JOIN room_type rt 
            ON r.typeid = rt.typeid
        JOIN rooms ro 
            ON r.roomid = ro.roomid 
        WHERE r.reservationid = $1 AND
            r.hotelid = $2
    `
    const q1result = await pool.query(q1, [id, hotelid])

    q1result.rows.forEach((r)=>{
        if(r.reservationdate){
            r.reservationdate = formatDate(r.reservationdate)
        }
        if(r.checkindate){
            r.checkindate = formatDate(r.checkindate)
        }
        if(r.checkoutdate){
            r.checkoutdate = formatDate(r.checkoutdate)
        }
    })

    res.render('receptionist/reservation/detail', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        r: q1result.rows[0]
    })
})

//- route that handles checkin
router.post('/checkin', isAuthenticated, getHotelLogo, getHotelColor, async (req, res) => {
    try {
        //- move reservation to guestaccounts
        const { reservationid } = req.body;
        const reservation = await pool.query('SELECT * FROM reservations WHERE reservationid = \$1', [reservationid]);
        const r = reservation.rows[0];

        const reservationd = await pool.query('SELECT * FROM reservation_guestdetails WHERE reservationid = \$1', [reservationid]);
        const rd = reservationd.rows[0];

        //- insert to "guestaccounts" T
        const q1 = `
            INSERT INTO guestaccounts(hotelid, typeid, roomid, adultno, childno, reservationdate, checkindate, checkoutdate, numofdays, modeofpayment, promocode)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `
        const q1result = await pool.query(q1, [hotelid, r.typeid, r.roomid, r.adultno, r.childno, r.reservationdate, r.checkindate, r.checkoutdate, r.numofdays, 'Card', r.promocode])

        //- get accountid of newly inserted record
        const accountid = q1result.rows[0].accountid

        //- insert to "guestaccount_guestdetails" T
        const q2 = `
            INSERT INTO guestaccounts_guestdetails(accountid, hotelid, fullname, email, contactno, address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `
        const q2result = await pool.query(q2, [accountid, hotelid, rd.fullname, rd.email, rd.contactno, rd.address])


        //- insert in history
        //- insert to "hist_reservations" T
        const q3 = `
            INSERT INTO hist_reservations(reservationid, hotelid, typeid, roomid, adultno, childno, reservationdate, checkindate, checkoutdate, numofdays, promocode, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `
        const q3result = await pool.query(q3, [reservationid, hotelid, r.typeid, r.roomid, r.adultno, r.childno, r.reservationdate, r.checkindate, r.checkoutdate, r.numofdays, r.promocode, 'Checked-in'])

        //- insert to "hist_reservation_guestdetails" T
        const q4 = `
            INSERT INTO hist_reservation_guestdetails(reservationid, hotelid, fullname, email, contactno, address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `
        const q4result = await pool.query(q4, [reservationid, hotelid, rd.fullname, rd.email, rd.contactno, rd.address])

        //- delete from reservation table
        await pool.query('DELETE FROM reservations WHERE reservationid = $1', [reservationid]);
        
        res.redirect('/reservation');

    }
    catch (error) {
        console.error(error.message) 
    }
});

//- route that handles cancel reservation
router.post('/cancelReservation', isAuthenticated, getHotelLogo, getHotelColor, async (req, res) => {
    try {
        const { reservationid } = req.body;
        const reservation = await pool.query('SELECT * FROM reservations WHERE reservationid = \$1', [reservationid]);
        const r = reservation.rows[0];

        const reservationd = await pool.query('SELECT * FROM reservation_guestdetails WHERE reservationid = \$1', [reservationid]);
        const rd = reservationd.rows[0];

        //- insert in history
        //- insert to "hist_reservations" T
        const q3 = `
            INSERT INTO hist_reservations(reservationid, hotelid, typeid, roomid, adultno, childno, reservationdate, checkindate, checkoutdate, numofdays, promocode, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `
        const q3result = await pool.query(q3, [reservationid, hotelid, r.typeid, r.roomid, r.adultno, r.childno, r.reservationdate, r.checkindate, r.checkoutdate, r.numofdays, r.promocode, 'Cancelled'])

        //- insert to "hist_reservation_guestdetails" T
        const q4 = `
            INSERT INTO hist_reservation_guestdetails(reservationid, hotelid, fullname, email, contactno, address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `
        const q4result = await pool.query(q4, [reservationid, hotelid, rd.fullname, rd.email, rd.contactno, rd.address])


        //- delete reservation based on reservationid
        await pool.query('DELETE FROM reservations WHERE reservationid = $1', [reservationid]);
        
        res.redirect('/reservation');
    }
    catch (error) {
        console.error(error.message) 
    }
    
});


module.exports = router