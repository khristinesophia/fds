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

//- utils
const formatDateWithTime = require(path.join(__basedir, 'utils', 'formatDateWithTime'))
const formatDate = require(path.join(__basedir, 'utils', 'formatDate'))




//- render HSA dashboard
router.get('/hsadmin', isAuthenticated, getHotelColor, getHotelLogo, async(req,res)=>{
    const hotelid = req.session.hotelID

    try {
        //- q1
        //- get active guestaccounts count
        const q1 = `
            SELECT COUNT(*) 
            FROM guestaccounts 
            WHERE hotelid = $1
        `
        const q1result = await pool.query(q1, [hotelid])
        const guestAccountCount = q1result.rows[0].count

        //- q2 
        //- get vacant rooms count
        const q2 = `
            SELECT COUNT(*) 
            FROM rooms 
            WHERE hotelid = $1 
                AND status = $2
        `
        const q2result = await pool.query(q2, [hotelid, 'Vacant'])
        const vacantRoomCount = q2result.rows[0].count

        //- q3
        //- get occupied rooms count
        const q3 = `
            SELECT COUNT(*) 
            FROM rooms 
            WHERE hotelid = $1 AND 
                status = $2 OR 
                status = $3 OR 
                status = $4 OR 
                status = $5 
        `
        const q3result = await pool.query(q3, [hotelid, 'Occupied', 'To check-out', 'Inspected', 'Recently checked-out'])
        const occupiedRoomCount = q3result.rows[0].count

        //- q4
        //- get adult no
        const q4 = `
            SELECT adultno
            FROM guestaccounts
            WHERE hotelid = $1
        `
        const q4result = await pool.query(q4, [hotelid])
        let adultNoCount = 0
        q4result.rows.forEach(row => {
            adultNoCount += row.adultno
        })

        //- q5
        //- get child no
        const q5 = `
            SELECT childno
            FROM guestaccounts
            WHERE hotelid = $1
        `
        const q5result = await pool.query(q5, [hotelid])
        let childNoCount = 0
        q5result.rows.forEach(row => {
            childNoCount += row.childno
        })

        //- q6
        //- get first 3 departures
        const q6 = `
            SELECT 
                t3.roomnum,
                t2.fullname,
                t1.checkoutdate
            FROM guestaccounts t1
            JOIN guestaccounts_guestdetails t2
                ON t1.accountid = t2.accountid
            JOIN rooms t3
                ON t1.roomid = t3.roomid
            WHERE t1.hotelid = $1
            ORDER BY checkoutdate ASC
            LIMIT 3
        `
        const q6result = await pool.query(q6, [hotelid])
        q6result.rows.forEach(row=>{
            if(row.checkoutdate){
                row.checkoutdate = formatDateWithTime(row.checkoutdate)
            }
        })


        //- q7
        //- get reservation per roomtype and count
        const q7 = `
            SELECT DISTINCT rt.roomtype, COUNT(rt.roomtype) AS roomtype_count 
            FROM room_type rt
            JOIN reservations r
            ON rt.typeid = r.typeid
            WHERE r.hotelid = $1
            GROUP BY rt.roomtype;
        `
        const q7result = await pool.query(q7, [hotelid])

        //- q8
        //- overall count of reservations
        const q8 = `
            SELECT COUNT(*)
            FROM reservations
            WHERE hotelid = $1;
        `
        const q8result = await pool.query(q8, [hotelid])
        const reservationAllCount = q8result.rows[0].count

        //- q9
        //- get rooms count per roomtype and status
        const q9 = `
        SELECT
            rt.roomtype,
            COUNT(*) FILTER (WHERE r.status = 'Vacant') AS vacantcount,
            COUNT(*) FILTER (WHERE r.status = 'Occupied') AS occupiedcount,
            COUNT(*) FILTER (WHERE r.status = 'On-Change') AS onchangecount,
            COUNT(*) FILTER (WHERE r.status = 'Out-of-Order') AS outofordercount,
            (COUNT(*) FILTER (WHERE r.status = 'Vacant') +
            COUNT(*) FILTER (WHERE r.status = 'Occupied') +
            COUNT(*) FILTER (WHERE r.status = 'On-Change') +
            COUNT(*) FILTER (WHERE r.status = 'Out-of-Order') +
            COUNT(CASE WHEN r.status NOT IN ('Reserved', '', NULL) THEN 1 END)) AS totalcount
        FROM rooms r
        JOIN room_type rt ON rt.typeid = r.typeid
        WHERE r.hotelid = $1
        GROUP BY rt.roomtype
        ORDER BY rt.roomtype;
        `
        const q9result = await pool.query(q9, [hotelid])


        //- q6
        //- get first 3 arrival
        const q10 = `
            SELECT 
                t1.reservationid,
                t2.fullname,
                t1.checkindate
            FROM reservations t1
            JOIN reservation_guestdetails t2
                ON t1.reservationid = t2.reservationid
            WHERE t1.hotelid = $1
            ORDER BY checkindate ASC
            LIMIT 3
        `
        const q10result = await pool.query(q10, [hotelid])
        q10result.rows.forEach(row=>{
            if(row.checkindate){
                row.checkindate = formatDate(row.checkindate)
            }
        })


        res.render('dashboard/hsadmin', {
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage,
            guestAccountCount: guestAccountCount,
            vacantRoomCount: vacantRoomCount, 
            occupiedRoomCount: occupiedRoomCount,
            adultNoCount: adultNoCount,
            childNoCount: childNoCount,
            departuresArray: q6result.rows,
            reservations: q7result.rows,
            reservationAllCount: reservationAllCount,
            rooms: q9result.rows,
            arrivalArray: q10result.rows
        })
    } catch (error) {
        console.error("Error fetching data for the receptionist dashboard", error)
        res.sendStatus(500) // or render an error page, handle as needed
    }
})

//- render R dashboard
router.get('/receptionist', isAuthenticated, getHotelColor, getHotelLogo, async (req, res) => {
    const hotelid = req.session.hotelID

    try {
        //- q1
        //- get active guestaccounts count
        const q1 = `
            SELECT COUNT(*) 
            FROM guestaccounts 
            WHERE hotelid = $1
        `
        const q1result = await pool.query(q1, [hotelid])
        const guestAccountCount = q1result.rows[0].count

        //- q2 
        //- get vacant rooms count
        const q2 = `
            SELECT COUNT(*) 
            FROM rooms 
            WHERE hotelid = $1 
                AND status = $2
        `
        const q2result = await pool.query(q2, [hotelid, 'Vacant'])
        const vacantRoomCount = q2result.rows[0].count

        //- q3
        //- get occupied rooms count
        const q3 = `
            SELECT COUNT(*) 
            FROM rooms 
            WHERE hotelid = $1 AND 
                status = $2 OR 
                status = $3 OR 
                status = $4 OR 
                status = $5 
        `
        const q3result = await pool.query(q3, [hotelid, 'Occupied', 'To check-out', 'Inspected', 'Recently checked-out'])
        const occupiedRoomCount = q3result.rows[0].count

        //- q4
        //- get adult no
        const q4 = `
            SELECT adultno
            FROM guestaccounts
            WHERE hotelid = $1
        `
        const q4result = await pool.query(q4, [hotelid])
        let adultNoCount = 0
        q4result.rows.forEach(row => {
            adultNoCount += row.adultno
        })

        //- q5
        //- get child no
        const q5 = `
            SELECT childno
            FROM guestaccounts
            WHERE hotelid = $1
        `
        const q5result = await pool.query(q5, [hotelid])
        let childNoCount = 0
        q5result.rows.forEach(row => {
            childNoCount += row.childno
        })

        //- q6
        //- get first 3 departures
        const q6 = `
            SELECT 
                t3.roomnum,
                t2.fullname,
                t1.checkoutdate
            FROM guestaccounts t1
            JOIN guestaccounts_guestdetails t2
                ON t1.accountid = t2.accountid
            JOIN rooms t3
                ON t1.roomid = t3.roomid
            WHERE t1.hotelid = $1
            ORDER BY checkoutdate ASC
            LIMIT 3
        `
        const q6result = await pool.query(q6, [hotelid])
        q6result.rows.forEach(row=>{
            if(row.checkoutdate){
                row.checkoutdate = formatDateWithTime(row.checkoutdate)
            }
        })


        //- q7
        //- get reservation per roomtype and count
        const q7 = `
            SELECT DISTINCT rt.roomtype, COUNT(rt.roomtype) AS roomtype_count 
            FROM room_type rt
            JOIN reservations r
            ON rt.typeid = r.typeid
            WHERE r.hotelid = $1
            GROUP BY rt.roomtype;
        `
        const q7result = await pool.query(q7, [hotelid])

        //- q8
        //- overall count of reservations
        const q8 = `
            SELECT COUNT(*)
            FROM reservations
            WHERE hotelid = $1;
        `
        const q8result = await pool.query(q8, [hotelid])
        const reservationAllCount = q8result.rows[0].count

        //- q9
        //- get rooms count per roomtype and status
        const q9 = `
        SELECT
            rt.roomtype,
            COUNT(*) FILTER (WHERE r.status = 'Vacant') AS vacantcount,
            COUNT(*) FILTER (WHERE r.status = 'Occupied') AS occupiedcount,
            COUNT(*) FILTER (WHERE r.status = 'On-Change') AS onchangecount,
            COUNT(*) FILTER (WHERE r.status = 'Out-of-Order') AS outofordercount,
            (COUNT(*) FILTER (WHERE r.status = 'Vacant') +
            COUNT(*) FILTER (WHERE r.status = 'Occupied') +
            COUNT(*) FILTER (WHERE r.status = 'On-Change') +
            COUNT(*) FILTER (WHERE r.status = 'Out-of-Order') +
            COUNT(CASE WHEN r.status NOT IN ('Reserved', '', NULL) THEN 1 END)) AS totalcount
        FROM rooms r
        JOIN room_type rt ON rt.typeid = r.typeid
        WHERE r.hotelid = $1
        GROUP BY rt.roomtype
        ORDER BY rt.roomtype;
        `
        const q9result = await pool.query(q9, [hotelid])


        //- q6
        //- get first 3 arrival
        const q10 = `
            SELECT 
                t1.reservationid,
                t2.fullname,
                t1.checkindate
            FROM reservations t1
            JOIN reservation_guestdetails t2
                ON t1.reservationid = t2.reservationid
            WHERE t1.hotelid = $1
            ORDER BY checkindate ASC
            LIMIT 3
        `
        const q10result = await pool.query(q10, [hotelid])
        q10result.rows.forEach(row=>{
            if(row.checkindate){
                row.checkindate = formatDate(row.checkindate)
            }
        })

        //- q11
        //- get archived guestaccounts count
        //- checked-out count
        const q11 = `
            SELECT COUNT(*) 
            FROM hist_guestaccounts 
            WHERE hotelid = $1
        `
        const q11result = await pool.query(q11, [hotelid])
        const archivedGuestAccountCount = q11result.rows[0].count

        //- q12
        //- get adult no (hist)
        const q12 = `
            SELECT adultno
            FROM hist_guestaccounts
            WHERE hotelid = $1
        `
        const q12result = await pool.query(q12, [hotelid])
        let hist_adultNoCount = 0
        q12result.rows.forEach(row => {
            hist_adultNoCount += row.adultno
        })

        //- q13
        //- get child no (hist)
        const q13 = `
            SELECT childno
            FROM hist_guestaccounts
            WHERE hotelid = $1
        `
        const q13result = await pool.query(q13, [hotelid])
        let hist_childNoCount = 0
        q13result.rows.forEach(row => {
            hist_childNoCount += row.childno
        })
        
        //- overall stayed guests count
        const overallStayedGuestsCount = hist_adultNoCount + hist_childNoCount



        res.render('dashboard/receptionist', {
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage,
            guestAccountCount: guestAccountCount,
            archivedGuestAccountCount: archivedGuestAccountCount,
            overallStayedGuestsCount: overallStayedGuestsCount,
            vacantRoomCount: vacantRoomCount, 
            occupiedRoomCount: occupiedRoomCount,
            adultNoCount: adultNoCount,
            childNoCount: childNoCount,
            departuresArray: q6result.rows,
            reservations: q7result.rows,
            reservationAllCount: reservationAllCount,
            rooms: q9result.rows,
            arrivalArray: q10result.rows
        })
    } catch (error) {
        console.error("Error fetching data for the receptionist dashboard", error)
        res.sendStatus(500) // or render an error page, handle as needed
    }
})




module.exports = router