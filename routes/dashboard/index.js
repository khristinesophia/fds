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
const { formatCurrency } = require(path.join(__basedir, 'utils', 'formatCurrency'))
const { getDate365DaysAgo, 
    getDate30DaysAgo, 
    getDate7DaysAgo, 
    getDate1DayAgo } = require(path.join(__basedir, 'utils', 'getDateDaysAgo'))



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
            LIMIT 5
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
            SELECT rt.roomtype, COUNT(r.typeid) AS roomtype_count 
            FROM room_type rt
            LEFT JOIN reservations r ON rt.typeid = r.typeid 
            WHERE rt.hotelid = $1
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


        //- q10
        //- get first 3 arrival
        const q10 = `
            SELECT 
                t1.reservationid,
                t2.fullname,
                t1.checkindate
            FROM reservations t1
            JOIN reservation_guestdetails t2
                ON t1.reservationid = t2.reservationid
            WHERE 
                t1.hotelid = $1
                AND t1.checkindate::date = CURRENT_DATE;
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

        //- q14
        //- get new book count today
        const q14 = `
            SELECT COUNT(*) AS new_book_count 
            FROM reservations
            WHERE DATE(reservationdate) = CURRENT_DATE AND hotelid = $1;
        `;
        const q14result = await pool.query(q14, [hotelid]);
        const newBookCount = q14result.rows[0].new_book_count;


        //- q15
        //- get shifts and assigned manager
        const q15 = `
        SELECT
            ul.fullname AS "empname",
            s.shiftname AS "shift",
            TO_CHAR(s.starthour, 'HH:MI AM') AS "starthour",
            TO_CHAR(s.endhour, 'HH:MI AM') AS "endhour",
            ha.username AS "assignman"
        FROM
            public.user_login ul
        JOIN
            public.shifts s ON ul.shiftid = s.shiftid
        LEFT JOIN
            public.hoteladmin_login ha ON ul.shiftid = ha.shiftid
                AND ul.hotelid = ha.hotelid
        WHERE ul.hotelid = $1
        ORDER BY
            s.starthour;
        `
        const q15result = await pool.query(q15, [hotelid])

        const hotelID = req.session.hotelID
        const { range } = req.query
        
        //- filter for revenue
        let startdate

        let data = []
        let summary = {
            totalRevenue: 0,
            totalPercentageOfRevenue: 100.0,
            highestOccupancyRate: 0,
            highestOccupancyRateRoomType: null,
            highestPercentageOfRevenue: 0,
            highestPercentageOfRevenueRoomType: null,
        }

        //- format total percentage of revenue
        summary.totalPercentageOfRevenue = `${summary.totalPercentageOfRevenue}%`


        //- range is YEARLY
        if(range === 'Yearly'){
            startdate = getDate365DaysAgo()

            const result = await pool.query(`
            SELECT 
                t1.roomtype,
                COALESCE(t2.room_count, 0) AS room_count, 
                COALESCE(t3.guestaccount_count, 0) AS guestaccount_count,
                ROUND(COALESCE(t3.guestaccount_count * 100.0 / NULLIF(t2.room_count, 0), 0), 1) AS occupancy_rate,
                COALESCE(t4.revenue, 0) AS revenue,
                ROUND(COALESCE(t4.revenue * 100.0 / NULLIF(SUM(t4.revenue) OVER(), 0), 0), 1) AS percentage_of_revenue
            FROM room_type t1
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    COUNT(t2.roomid) AS room_count
                FROM room_type t1
                JOIN rooms t2
                    ON t1.typeid = t2.typeid
                GROUP BY t1.typeid
                ) t2
            ON t1.typeid = t2.typeid
            LEFT JOIN (
                SELECT 
                    t1.roomtype,
                    COUNT(t3.accountid) AS guestaccount_count
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t3
                    ON t1.roomtype = t3.roomtype
                WHERE t3.checkoutdate >= $1
                GROUP BY t1.roomtype
                ) t3
            ON t1.roomtype = t3.roomtype
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    SUM(t3.paid) AS revenue
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t2
                    ON t1.roomtype = t2.roomtype
                LEFT JOIN hist_folios t3
                    ON t2.accountid = t3.accountid
                WHERE t2.checkoutdate >= $2
                GROUP BY t1.typeid
                ) t4
            ON t1.typeid = t4.typeid
            WHERE t1.hotelid = $3
            `, [startdate, startdate, hotelID])

            //- get TOTAL REVENUE
            result.rows.forEach(row=>{
                if(row.revenue){
                    summary.totalRevenue += parseFloat(row.revenue)
                }
            })
            summary.totalRevenue = formatCurrency(summary.totalRevenue)

            //- get room type with HIGHEST OCCUPANCY RATE
            result.rows.forEach(row => {
                if(row.occupancy_rate > summary.highestOccupancyRate) {
                    summary.highestOccupancyRate = row.occupancy_rate
                    summary.highestOccupancyRateRoomType = row.roomtype
                }
            })

            //- get room type with HIGHEST PERCENTAGE OF REVENUE
            result.rows.forEach(row => {
                if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                    summary.highestPercentageOfRevenue = row.percentage_of_revenue
                    summary.highestPercentageOfRevenueRoomType = row.roomtype
                }
            })

            //- format occupancy rate per room type
            result.rows.forEach(row => {
                if(row.occupancy_rate) {
                    row.occupancy_rate = `${row.occupancy_rate}%`
                }
            })

            //- format revenue per room type
            result.rows.forEach(row => {
                if(row.revenue) {
                    row.revenue = formatCurrency(row.revenue)
                }
            })

            //- format percentage of revenue per room type
            result.rows.forEach(row => {
                if(row.percentage_of_revenue) {
                    row.percentage_of_revenue = `${row.percentage_of_revenue}%`
                }
            })

            data = result.rows
        } 

        //- range is MONTHLY
        else if(range === 'Monthly'){
            startdate = getDate30DaysAgo()

            const result = await pool.query(`
            SELECT 
                t1.roomtype,
                COALESCE(t2.room_count, 0) AS room_count, 
                COALESCE(t3.guestaccount_count, 0) AS guestaccount_count,
                ROUND(COALESCE(t3.guestaccount_count * 100.0 / NULLIF(t2.room_count, 0), 0), 1) AS occupancy_rate,
                COALESCE(t4.revenue, 0) AS revenue,
                ROUND(COALESCE(t4.revenue * 100.0 / NULLIF(SUM(t4.revenue) OVER(), 0), 0), 1) AS percentage_of_revenue
            FROM room_type t1
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    COUNT(t2.roomid) AS room_count
                FROM room_type t1
                JOIN rooms t2
                    ON t1.typeid = t2.typeid
                GROUP BY t1.typeid
                ) t2
            ON t1.typeid = t2.typeid
            LEFT JOIN (
                SELECT 
                    t1.roomtype,
                    COUNT(t3.accountid) AS guestaccount_count
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t3
                    ON t1.roomtype = t3.roomtype
                WHERE t3.checkoutdate >= $1
                GROUP BY t1.roomtype
                ) t3
            ON t1.roomtype = t3.roomtype
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    SUM(t3.paid) AS revenue
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t2
                    ON t1.roomtype = t2.roomtype
                LEFT JOIN hist_folios t3
                    ON t2.accountid = t3.accountid
                WHERE t2.checkoutdate >= $2
                GROUP BY t1.typeid
                ) t4
            ON t1.typeid = t4.typeid
            WHERE t1.hotelid = $3
            `, [startdate, startdate, hotelID])

            //- get TOTAL REVENUE
            result.rows.forEach(row=>{
                if(row.revenue){
                    summary.totalRevenue += parseFloat(row.revenue)
                }
            })
            summary.totalRevenue = formatCurrency(summary.totalRevenue)

            //- get room type with HIGHEST OCCUPANCY RATE
            result.rows.forEach(row => {
                if(row.occupancy_rate > summary.highestOccupancyRate) {
                    summary.highestOccupancyRate = row.occupancy_rate
                    summary.highestOccupancyRateRoomType = row.roomtype
                }
            })

            //- get room type with HIGHEST PERCENTAGE OF REVENUE
            result.rows.forEach(row => {
                if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                    summary.highestPercentageOfRevenue = row.percentage_of_revenue
                    summary.highestPercentageOfRevenueRoomType = row.roomtype
                }
            })

            //- format occupancy rate per room type
            result.rows.forEach(row => {
                if(row.occupancy_rate) {
                    row.occupancy_rate = `${row.occupancy_rate}%`
                }
            })

            //- format revenue per room type
            result.rows.forEach(row => {
                if(row.revenue) {
                    row.revenue = formatCurrency(row.revenue)
                }
            })

            //- format percentage of revenue per room type
            result.rows.forEach(row => {
                if(row.percentage_of_revenue) {
                    row.percentage_of_revenue = `${row.percentage_of_revenue}%`
                }
            })

            data = result.rows
        }

        //- range is WEEKLY
        else if(range === 'Weekly'){
            startdate = getDate7DaysAgo()

            const result = await pool.query(`
            SELECT 
                t1.roomtype,
                COALESCE(t2.room_count, 0) AS room_count, 
                COALESCE(t3.guestaccount_count, 0) AS guestaccount_count,
                ROUND(COALESCE(t3.guestaccount_count * 100.0 / NULLIF(t2.room_count, 0), 0), 1) AS occupancy_rate,
                COALESCE(t4.revenue, 0) AS revenue,
                ROUND(COALESCE(t4.revenue * 100.0 / NULLIF(SUM(t4.revenue) OVER(), 0), 0), 1) AS percentage_of_revenue
            FROM room_type t1
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    COUNT(t2.roomid) AS room_count
                FROM room_type t1
                JOIN rooms t2
                    ON t1.typeid = t2.typeid
                GROUP BY t1.typeid
                ) t2
            ON t1.typeid = t2.typeid
            LEFT JOIN (
                SELECT 
                    t1.roomtype,
                    COUNT(t3.accountid) AS guestaccount_count
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t3
                    ON t1.roomtype = t3.roomtype
                WHERE t3.checkoutdate >= $1
                GROUP BY t1.roomtype
                ) t3
            ON t1.roomtype = t3.roomtype
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    SUM(t3.paid) AS revenue
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t2
                    ON t1.roomtype = t2.roomtype
                LEFT JOIN hist_folios t3
                    ON t2.accountid = t3.accountid
                WHERE t2.checkoutdate >= $2
                GROUP BY t1.typeid
                ) t4
            ON t1.typeid = t4.typeid
            WHERE t1.hotelid = $3
            `, [startdate, startdate, hotelID])

            //- get TOTAL REVENUE
            result.rows.forEach(row=>{
                if(row.revenue){
                    summary.totalRevenue += parseFloat(row.revenue)
                }
            })
            summary.totalRevenue = formatCurrency(summary.totalRevenue)

            //- get room type with HIGHEST OCCUPANCY RATE
            result.rows.forEach(row => {
                if(row.occupancy_rate > summary.highestOccupancyRate) {
                    summary.highestOccupancyRate = row.occupancy_rate
                    summary.highestOccupancyRateRoomType = row.roomtype
                }
            })

            //- get room type with HIGHEST PERCENTAGE OF REVENUE
            result.rows.forEach(row => {
                if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                    summary.highestPercentageOfRevenue = row.percentage_of_revenue
                    summary.highestPercentageOfRevenueRoomType = row.roomtype
                }
            })

            //- format occupancy rate per room type
            result.rows.forEach(row => {
                if(row.occupancy_rate) {
                    row.occupancy_rate = `${row.occupancy_rate}%`
                }
            })

            //- format revenue per room type
            result.rows.forEach(row => {
                if(row.revenue) {
                    row.revenue = formatCurrency(row.revenue)
                }
            })

            //- format percentage of revenue per room type
            result.rows.forEach(row => {
                if(row.percentage_of_revenue) {
                    row.percentage_of_revenue = `${row.percentage_of_revenue}%`
                }
            })

            data = result.rows
        }

        //- there is NO filter
        else {
            startdate = getDate1DayAgo()

            const result = await pool.query(`
            SELECT 
                t1.roomtype,
                COALESCE(t2.room_count, 0) AS room_count, 
                COALESCE(t3.guestaccount_count, 0) AS guestaccount_count,
                ROUND(COALESCE(t3.guestaccount_count * 100.0 / NULLIF(t2.room_count, 0), 0), 1) AS occupancy_rate,
                COALESCE(t4.revenue, 0) AS revenue,
                ROUND(COALESCE(t4.revenue * 100.0 / NULLIF(SUM(t4.revenue) OVER(), 0), 0), 1) AS percentage_of_revenue
            FROM room_type t1
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    COUNT(t2.roomid) AS room_count
                FROM room_type t1
                JOIN rooms t2
                    ON t1.typeid = t2.typeid
                GROUP BY t1.typeid
                ) t2
            ON t1.typeid = t2.typeid
            LEFT JOIN (
                SELECT 
                    t1.roomtype,
                    COUNT(t3.accountid) AS guestaccount_count
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t3
                    ON t1.roomtype = t3.roomtype
                WHERE t3.checkoutdate >= $1
                GROUP BY t1.roomtype
                ) t3
            ON t1.roomtype = t3.roomtype
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    SUM(t3.paid) AS revenue
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t2
                    ON t1.roomtype = t2.roomtype
                LEFT JOIN hist_folios t3
                    ON t2.accountid = t3.accountid
                WHERE t2.checkoutdate >= $2
                GROUP BY t1.typeid
                ) t4
            ON t1.typeid = t4.typeid
            WHERE t1.hotelid = $3
            `, [startdate, startdate, hotelID])

            //- get TOTAL REVENUE
            result.rows.forEach(row=>{
                if(row.revenue){
                    summary.totalRevenue += parseFloat(row.revenue)
                }
            })
            summary.totalRevenue = formatCurrency(summary.totalRevenue)

            //- get room type with HIGHEST OCCUPANCY RATE
            result.rows.forEach(row => {
                if(row.occupancy_rate > summary.highestOccupancyRate) {
                    summary.highestOccupancyRate = row.occupancy_rate
                    summary.highestOccupancyRateRoomType = row.roomtype
                }
            })

            //- get room type with HIGHEST PERCENTAGE OF REVENUE
            result.rows.forEach(row => {
                if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                    summary.highestPercentageOfRevenue = row.percentage_of_revenue
                    summary.highestPercentageOfRevenueRoomType = row.roomtype
                }
            })

            //- format occupancy rate per room type
            result.rows.forEach(row => {
                if(row.occupancy_rate) {
                    row.occupancy_rate = `${row.occupancy_rate}%`
                }
            })

            //- format revenue per room type
            result.rows.forEach(row => {
                if(row.revenue) {
                    row.revenue = formatCurrency(row.revenue)
                }
            })

            //- format percentage of revenue per room type
            result.rows.forEach(row => {
                if(row.percentage_of_revenue) {
                    row.percentage_of_revenue = `${row.percentage_of_revenue}%`
                }
            })

            data = result.rows
        }


        res.render('dashboard/hsadmin', {
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
            arrivalArray: q10result.rows,
            newBookCount: newBookCount,
            shiftArray: q15result.rows,
            dataArray: data,
            summary: summary
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
            LIMIT 5
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
            SELECT rt.roomtype, COUNT(r.typeid) AS roomtype_count 
            FROM room_type rt
            LEFT JOIN reservations r ON rt.typeid = r.typeid
            WHERE rt.hotelid = $1
            GROUP BY rt.roomtype
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


        //- q10
        //- get first 3 arrival
        /*const q10 = `
            SELECT 
                t1.reservationid,
                t2.fullname,
                t1.checkindate
            FROM reservations t1
            JOIN reservation_guestdetails t2
                ON t1.reservationid = t2.reservationid
            WHERE t1.hotelid = $1
            ORDER BY checkindate ASC
            LIMIT 5
        `*/
        const q10 = `
            SELECT 
                t1.reservationid,
                t2.fullname,
                t1.checkindate
            FROM reservations t1
            JOIN reservation_guestdetails t2
                ON t1.reservationid = t2.reservationid
            WHERE 
                t1.hotelid = $1
                AND t1.checkindate::date = CURRENT_DATE;
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

        //- q11
        //- get new book count today
        const q14 = `
            SELECT COUNT(*) AS new_book_count 
            FROM reservations
            WHERE DATE(reservationdate) = CURRENT_DATE AND hotelid = $1;
        `;
        const q14result = await pool.query(q14, [hotelid]);
        const newBookCount = q14result.rows[0].new_book_count;

        //- q15
        //- get shifts and assigned manager
        const q15 = `
        SELECT
            ul.fullname AS "empname",
            s.shiftname AS "shift",
            TO_CHAR(s.starthour, 'HH:MI AM') AS "starthour",
            TO_CHAR(s.endhour, 'HH:MI AM') AS "endhour",
            ha.username AS "assignman"
        FROM
            public.user_login ul
        JOIN
            public.shifts s ON ul.shiftid = s.shiftid
        LEFT JOIN
            public.hoteladmin_login ha ON ul.shiftid = ha.shiftid
                AND ul.hotelid = ha.hotelid
        WHERE ul.hotelid = $1
        ORDER BY
            s.starthour;
        `
        const q15result = await pool.query(q15, [hotelid])

        const hotelID = req.session.hotelID
        const { range } = req.query

        let startdate

        let data = []
        let summary = {
            totalRevenue: 0,
            totalPercentageOfRevenue: 100.0,
            highestOccupancyRate: 0,
            highestOccupancyRateRoomType: null,
            highestPercentageOfRevenue: 0,
            highestPercentageOfRevenueRoomType: null,
        }

        //- format total percentage of revenue
        summary.totalPercentageOfRevenue = `${summary.totalPercentageOfRevenue}%`


        //- range is YEARLY
        if(range === 'Yearly'){
            startdate = getDate365DaysAgo()

            const result = await pool.query(`
            SELECT 
                t1.roomtype,
                COALESCE(t2.room_count, 0) AS room_count, 
                COALESCE(t3.guestaccount_count, 0) AS guestaccount_count,
                ROUND(COALESCE(t3.guestaccount_count * 100.0 / NULLIF(t2.room_count, 0), 0), 1) AS occupancy_rate,
                COALESCE(t4.revenue, 0) AS revenue,
                ROUND(COALESCE(t4.revenue * 100.0 / NULLIF(SUM(t4.revenue) OVER(), 0), 0), 1) AS percentage_of_revenue
            FROM room_type t1
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    COUNT(t2.roomid) AS room_count
                FROM room_type t1
                JOIN rooms t2
                    ON t1.typeid = t2.typeid
                GROUP BY t1.typeid
                ) t2
            ON t1.typeid = t2.typeid
            LEFT JOIN (
                SELECT 
                    t1.roomtype,
                    COUNT(t3.accountid) AS guestaccount_count
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t3
                    ON t1.roomtype = t3.roomtype
                WHERE t3.checkoutdate >= $1
                GROUP BY t1.roomtype
                ) t3
            ON t1.roomtype = t3.roomtype
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    SUM(t3.paid) AS revenue
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t2
                    ON t1.roomtype = t2.roomtype
                LEFT JOIN hist_folios t3
                    ON t2.accountid = t3.accountid
                WHERE t2.checkoutdate >= $2
                GROUP BY t1.typeid
                ) t4
            ON t1.typeid = t4.typeid
            WHERE t1.hotelid = $3
            `, [startdate, startdate, hotelID])

            //- get TOTAL REVENUE
            result.rows.forEach(row=>{
                if(row.revenue){
                    summary.totalRevenue += parseFloat(row.revenue)
                }
            })
            summary.totalRevenue = formatCurrency(summary.totalRevenue)

            //- get room type with HIGHEST OCCUPANCY RATE
            result.rows.forEach(row => {
                if(row.occupancy_rate > summary.highestOccupancyRate) {
                    summary.highestOccupancyRate = row.occupancy_rate
                    summary.highestOccupancyRateRoomType = row.roomtype
                }
            })

            //- get room type with HIGHEST PERCENTAGE OF REVENUE
            result.rows.forEach(row => {
                if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                    summary.highestPercentageOfRevenue = row.percentage_of_revenue
                    summary.highestPercentageOfRevenueRoomType = row.roomtype
                }
            })

            //- format occupancy rate per room type
            result.rows.forEach(row => {
                if(row.occupancy_rate) {
                    row.occupancy_rate = `${row.occupancy_rate}%`
                }
            })

            //- format revenue per room type
            result.rows.forEach(row => {
                if(row.revenue) {
                    row.revenue = formatCurrency(row.revenue)
                }
            })

            //- format percentage of revenue per room type
            result.rows.forEach(row => {
                if(row.percentage_of_revenue) {
                    row.percentage_of_revenue = `${row.percentage_of_revenue}%`
                }
            })

            data = result.rows
        } 

        //- range is MONTHLY
        else if(range === 'Monthly'){
            startdate = getDate30DaysAgo()

            const result = await pool.query(`
            SELECT 
                t1.roomtype,
                COALESCE(t2.room_count, 0) AS room_count, 
                COALESCE(t3.guestaccount_count, 0) AS guestaccount_count,
                ROUND(COALESCE(t3.guestaccount_count * 100.0 / NULLIF(t2.room_count, 0), 0), 1) AS occupancy_rate,
                COALESCE(t4.revenue, 0) AS revenue,
                ROUND(COALESCE(t4.revenue * 100.0 / NULLIF(SUM(t4.revenue) OVER(), 0), 0), 1) AS percentage_of_revenue
            FROM room_type t1
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    COUNT(t2.roomid) AS room_count
                FROM room_type t1
                JOIN rooms t2
                    ON t1.typeid = t2.typeid
                GROUP BY t1.typeid
                ) t2
            ON t1.typeid = t2.typeid
            LEFT JOIN (
                SELECT 
                    t1.roomtype,
                    COUNT(t3.accountid) AS guestaccount_count
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t3
                    ON t1.roomtype = t3.roomtype
                WHERE t3.checkoutdate >= $1
                GROUP BY t1.roomtype
                ) t3
            ON t1.roomtype = t3.roomtype
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    SUM(t3.paid) AS revenue
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t2
                    ON t1.roomtype = t2.roomtype
                LEFT JOIN hist_folios t3
                    ON t2.accountid = t3.accountid
                WHERE t2.checkoutdate >= $2
                GROUP BY t1.typeid
                ) t4
            ON t1.typeid = t4.typeid
            WHERE t1.hotelid = $3
            `, [startdate, startdate, hotelID])

            //- get TOTAL REVENUE
            result.rows.forEach(row=>{
                if(row.revenue){
                    summary.totalRevenue += parseFloat(row.revenue)
                }
            })
            summary.totalRevenue = formatCurrency(summary.totalRevenue)

            //- get room type with HIGHEST OCCUPANCY RATE
            result.rows.forEach(row => {
                if(row.occupancy_rate > summary.highestOccupancyRate) {
                    summary.highestOccupancyRate = row.occupancy_rate
                    summary.highestOccupancyRateRoomType = row.roomtype
                }
            })

            //- get room type with HIGHEST PERCENTAGE OF REVENUE
            result.rows.forEach(row => {
                if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                    summary.highestPercentageOfRevenue = row.percentage_of_revenue
                    summary.highestPercentageOfRevenueRoomType = row.roomtype
                }
            })

            //- format occupancy rate per room type
            result.rows.forEach(row => {
                if(row.occupancy_rate) {
                    row.occupancy_rate = `${row.occupancy_rate}%`
                }
            })

            //- format revenue per room type
            result.rows.forEach(row => {
                if(row.revenue) {
                    row.revenue = formatCurrency(row.revenue)
                }
            })

            //- format percentage of revenue per room type
            result.rows.forEach(row => {
                if(row.percentage_of_revenue) {
                    row.percentage_of_revenue = `${row.percentage_of_revenue}%`
                }
            })

            data = result.rows
        }

        //- range is WEEKLY
        else if(range === 'Weekly'){
            startdate = getDate7DaysAgo()

            const result = await pool.query(`
            SELECT 
                t1.roomtype,
                COALESCE(t2.room_count, 0) AS room_count, 
                COALESCE(t3.guestaccount_count, 0) AS guestaccount_count,
                ROUND(COALESCE(t3.guestaccount_count * 100.0 / NULLIF(t2.room_count, 0), 0), 1) AS occupancy_rate,
                COALESCE(t4.revenue, 0) AS revenue,
                ROUND(COALESCE(t4.revenue * 100.0 / NULLIF(SUM(t4.revenue) OVER(), 0), 0), 1) AS percentage_of_revenue
            FROM room_type t1
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    COUNT(t2.roomid) AS room_count
                FROM room_type t1
                JOIN rooms t2
                    ON t1.typeid = t2.typeid
                GROUP BY t1.typeid
                ) t2
            ON t1.typeid = t2.typeid
            LEFT JOIN (
                SELECT 
                    t1.roomtype,
                    COUNT(t3.accountid) AS guestaccount_count
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t3
                    ON t1.roomtype = t3.roomtype
                WHERE t3.checkoutdate >= $1
                GROUP BY t1.roomtype
                ) t3
            ON t1.roomtype = t3.roomtype
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    SUM(t3.paid) AS revenue
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t2
                    ON t1.roomtype = t2.roomtype
                LEFT JOIN hist_folios t3
                    ON t2.accountid = t3.accountid
                WHERE t2.checkoutdate >= $2
                GROUP BY t1.typeid
                ) t4
            ON t1.typeid = t4.typeid
            WHERE t1.hotelid = $3
            `, [startdate, startdate, hotelID])

            //- get TOTAL REVENUE
            result.rows.forEach(row=>{
                if(row.revenue){
                    summary.totalRevenue += parseFloat(row.revenue)
                }
            })
            summary.totalRevenue = formatCurrency(summary.totalRevenue)

            //- get room type with HIGHEST OCCUPANCY RATE
            result.rows.forEach(row => {
                if(row.occupancy_rate > summary.highestOccupancyRate) {
                    summary.highestOccupancyRate = row.occupancy_rate
                    summary.highestOccupancyRateRoomType = row.roomtype
                }
            })

            //- get room type with HIGHEST PERCENTAGE OF REVENUE
            result.rows.forEach(row => {
                if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                    summary.highestPercentageOfRevenue = row.percentage_of_revenue
                    summary.highestPercentageOfRevenueRoomType = row.roomtype
                }
            })

            //- format occupancy rate per room type
            result.rows.forEach(row => {
                if(row.occupancy_rate) {
                    row.occupancy_rate = `${row.occupancy_rate}%`
                }
            })

            //- format revenue per room type
            result.rows.forEach(row => {
                if(row.revenue) {
                    row.revenue = formatCurrency(row.revenue)
                }
            })

            //- format percentage of revenue per room type
            result.rows.forEach(row => {
                if(row.percentage_of_revenue) {
                    row.percentage_of_revenue = `${row.percentage_of_revenue}%`
                }
            })

            data = result.rows
        }

        //- there is NO filter
        else {
            startdate = getDate1DayAgo()

            const result = await pool.query(`
            SELECT 
                t1.roomtype,
                COALESCE(t2.room_count, 0) AS room_count, 
                COALESCE(t3.guestaccount_count, 0) AS guestaccount_count,
                ROUND(COALESCE(t3.guestaccount_count * 100.0 / NULLIF(t2.room_count, 0), 0), 1) AS occupancy_rate,
                COALESCE(t4.revenue, 0) AS revenue,
                ROUND(COALESCE(t4.revenue * 100.0 / NULLIF(SUM(t4.revenue) OVER(), 0), 0), 1) AS percentage_of_revenue
            FROM room_type t1
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    COUNT(t2.roomid) AS room_count
                FROM room_type t1
                JOIN rooms t2
                    ON t1.typeid = t2.typeid
                GROUP BY t1.typeid
                ) t2
            ON t1.typeid = t2.typeid
            LEFT JOIN (
                SELECT 
                    t1.roomtype,
                    COUNT(t3.accountid) AS guestaccount_count
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t3
                    ON t1.roomtype = t3.roomtype
                WHERE t3.checkoutdate >= $1
                GROUP BY t1.roomtype
                ) t3
            ON t1.roomtype = t3.roomtype
            LEFT JOIN (
                SELECT 
                    t1.typeid,
                    SUM(t3.paid) AS revenue
                FROM room_type t1
                LEFT JOIN hist_guestaccounts t2
                    ON t1.roomtype = t2.roomtype
                LEFT JOIN hist_folios t3
                    ON t2.accountid = t3.accountid
                WHERE t2.checkoutdate >= $2
                GROUP BY t1.typeid
                ) t4
            ON t1.typeid = t4.typeid
            WHERE t1.hotelid = $3
            `, [startdate, startdate, hotelID])

            //- get TOTAL REVENUE
            result.rows.forEach(row=>{
                if(row.revenue){
                    summary.totalRevenue += parseFloat(row.revenue)
                }
            })
            summary.totalRevenue = formatCurrency(summary.totalRevenue)

            //- get room type with HIGHEST OCCUPANCY RATE
            result.rows.forEach(row => {
                if(row.occupancy_rate > summary.highestOccupancyRate) {
                    summary.highestOccupancyRate = row.occupancy_rate
                    summary.highestOccupancyRateRoomType = row.roomtype
                }
            })

            //- get room type with HIGHEST PERCENTAGE OF REVENUE
            result.rows.forEach(row => {
                if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                    summary.highestPercentageOfRevenue = row.percentage_of_revenue
                    summary.highestPercentageOfRevenueRoomType = row.roomtype
                }
            })

            //- format occupancy rate per room type
            result.rows.forEach(row => {
                if(row.occupancy_rate) {
                    row.occupancy_rate = `${row.occupancy_rate}%`
                }
            })

            //- format revenue per room type
            result.rows.forEach(row => {
                if(row.revenue) {
                    row.revenue = formatCurrency(row.revenue)
                }
            })

            //- format percentage of revenue per room type
            result.rows.forEach(row => {
                if(row.percentage_of_revenue) {
                    row.percentage_of_revenue = `${row.percentage_of_revenue}%`
                }
            })

            data = result.rows
        }



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
            arrivalArray: q10result.rows,
            newBookCount: newBookCount,
            shiftArray: q15result.rows,
            dataArray: data,
            summary: summary
        })
    } catch (error) {
        console.error("Error fetching data for the receptionist dashboard", error)
        res.sendStatus(500) // or render an error page, handle as needed
    }
})




module.exports = router