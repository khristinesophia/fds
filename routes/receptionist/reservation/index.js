const path = require('path')

const express = require('express')
const router = express.Router()

const pool = require(path.join(__basedir, 'config', 'db-config'))

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))

const formatDate = require(path.join(__basedir, 'utils', 'formatDate'))

const hotelid = 'H0T1L3D7';

//- Route for rendering the view
//router.get('/', async(req, res) => {
//    res.render('receptionist/reservation1/reservation1');
//});

router.get('/', isAuthenticated, getHotelColor, async(req, res)=>{
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
            hotelColor: req.hotelColor 
        });

    } catch (error) {
        console.error(error.message)
    }
});


//- render "detail" page
//- "r/:id"
router.get('/detail/:id', isAuthenticated, getHotelColor, async(req, res)=>{
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
        if(r.checkindate){
            r.checkindate = formatDate(r.checkindate)
        }
        if(r.checkoutdate){
            r.checkoutdate = formatDate(r.checkoutdate)
        }
    })

    res.render('receptionist/reservation/detail', {
        hotelColor: req.hotelColor,
        r: q1result.rows[0]
    })
})


module.exports = router