const path = require('path')

const express = require('express')
const router = express.Router()

const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const cron = require('node-cron')

const pool = require(path.join(__basedir, 'config', 'db-config'))

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))
const getHotelLogo = require(path.join(__basedir, 'middleware', 'getHotelLogo'))

const formatDate = require(path.join(__basedir, 'utils', 'formatDate'))
const getCurrentDate = require(path.join(__basedir, 'utils', 'getCurrentDate'))

const hotelid = 'H0T1L3D7';
const date = getCurrentDate()

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

        const allReservation = await pool.query(reservationQuery, [hotelid]);

        const colors = [
            '#1f77b4', '#2ca02c', '#d62728','#ff7f0e','#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
            '#334455', '#8899aa', '#dd4477', '#117733', '#aa88cc'
        ]; 

        const events = allReservation.rows.map((reservation, index) => ({
            title: `Name: ${reservation.fullname} - ReservationID: ${reservation.reservationid} | Room: ${reservation.roomnum}`,
            start: `${reservation.checkindate}T00:00:00`, // Include time information
            end: `${reservation.checkoutdate}T23:59:59`, // Include time information
            id: reservation.reservationid,
            color: colors[index % colors.length], // Alternate between the two colors
            allDay: false,
            displayEventTime: false,
        }));

        res.render('receptionist/reservation/reservation', { 
            events: JSON.stringify(events),
            hotelLogo: req.hotelImage,
            hotelColor: req.hotelColor 
        });

    } catch (error) {
        console.error(error.message);
    }
});


// Schedule task to run every day at 2:01 PM
cron.schedule('1 14 * * *', async () => {
    try {
        const currentDate = new Date();
        const currentHour = currentDate.getHours();
        const currentMinutes = currentDate.getMinutes();

        // Select reservationids with checkindate equal to the current date
        const checkinReservationsQuery = `
            SELECT
                r.reservationid
            FROM
                reservations r
            WHERE
                r.hotelid = $1
                AND checkindate <= CURRENT_DATE;
        `;

        const checkinReservations = await pool.query(checkinReservationsQuery, [hotelid]);

        // Loop through each reservationid and check the time conditions
        for (const reservationRow of checkinReservations.rows) {
            const reservationid = reservationRow.reservationid;

            if (currentHour >= 14 && currentMinutes >= 1) {
                const reservation = await pool.query('SELECT * FROM reservations WHERE reservationid = $1', [reservationid]);
                const r = reservation.rows[0];

                const reservationd = await pool.query('SELECT * FROM reservation_guestdetails WHERE reservationid = $1', [reservationid]);
                const rd = reservationd.rows[0];

                // Insert into history tables
                const q3 = `
                    INSERT INTO hist_reservations(reservationid, hotelid, typeid, roomid, adultno, childno, reservationdate, checkindate, checkoutdate, numofdays, promocode, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *
                `;
                const q3result = await pool.query(q3, [reservationid, hotelid, r.typeid, r.roomid, r.adultno, r.childno, r.reservationdate, r.checkindate, r.checkoutdate, r.numofdays, r.promocode, 'Cancelled']);

                const q4 = `
                    INSERT INTO hist_reservation_guestdetails(reservationid, hotelid, fullname, email, contactno, address)
                    VALUES ($1, $2, $3, $4, $5, $6);
                `;
                const q4result = await pool.query(q4, [reservationid, hotelid, rd.fullname, rd.email, rd.contactno, rd.address]);

                // Delete reservation based on reservationid
                await pool.query('DELETE FROM reservations WHERE reservationid = $1', [reservationid]);
                console.log("automatic cancellation performed")
            }
        }
    } catch (error) {
        console.error(error.message);
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

        const reservationt = await pool.query('SELECT * FROM reservation_trans WHERE reservationid = \$1', [reservationid]);
        const rt = reservationt.rows[0];

        //- Get the promoid of promocode
        const promoidres = await pool.query('SELECT id FROM promos WHERE code = $1', [r.promocode]);
        let promoid = null;

        if (promoidres.rows.length > 0) {
            promoid = promoidres.rows[0].code;
        }
        
        //- insert to "guestaccounts" T
        const q1 = `
            INSERT INTO guestaccounts(hotelid, typeid, roomid, adultno, childno, reservationdate, checkindate, checkoutdate, numofdays, modeofpayment, promoid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `
        const q1result = await pool.query(q1, [hotelid, r.typeid, r.roomid, r.adultno, r.childno, r.reservationdate, r.checkindate, r.checkoutdate, r.numofdays, 'Card', promoid])
        //- get accountid of newly inserted record
        const accountid = q1result.rows[0].accountid

        //- insert to "guestaccount_guestdetails" T
        const q2 = `
            INSERT INTO guestaccounts_guestdetails(accountid, hotelid, fullname, email, contactno, address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `
        const q2result = await pool.query(q2, [accountid, hotelid, rd.fullname, rd.email, rd.contactno, rd.address])

        //- insert to "folios"
        const q3 = `
            INSERT INTO folios(accountid, hotelid, discount, tax, paid, settled)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `
        const q3result = await pool.query(q3, [accountid, hotelid, rt.discount, 12, rt.amount, false])
        
        //- get folioid of newly inserted record
        const folioid = q3result.rows[0].folioid
    
        //- insert to "transactions" T
        const q4 = `
            INSERT INTO transactions(hotelid, accountid, folioid, roomid, description, price, qty, amount, date, paid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `
        const q4result = await pool.query(q4, [hotelid, accountid, folioid, r.roomid, rt.description, rt.price, rt.qty, rt.amount, date, true])
    
        //- update room status to 'Occupied'
        const q5 = `
            UPDATE rooms
                SET status = $1
            WHERE roomid = $2 AND 
                hotelid = $3
        `
        const q5result = await pool.query(q5, ['Occupied', r.roomid, hotelid])


        //- insert in history
        //- insert to "hist_reservations" T
        const q6 = `
            INSERT INTO hist_reservations(reservationid, hotelid, typeid, roomid, adultno, childno, reservationdate, checkindate, checkoutdate, numofdays, promocode, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `
        const q6result = await pool.query(q6, [reservationid, hotelid, r.typeid, r.roomid, r.adultno, r.childno, r.reservationdate, r.checkindate, r.checkoutdate, r.numofdays, r.promocode, 'Checked-in'])

        //- insert to "hist_reservation_guestdetails" T
        const q7 = `
            INSERT INTO hist_reservation_guestdetails(reservationid, hotelid, fullname, email, contactno, address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `
        const q7result = await pool.query(q7, [reservationid, hotelid, rd.fullname, rd.email, rd.contactno, rd.address])

        //- delete from reservation table
        await pool.query('DELETE FROM reservations WHERE reservationid = $1', [reservationid]);
        
        res.redirect('/reservation');
        return;

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