//- path import
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- middleware import
const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))
const getHotelLogo = require(path.join(__basedir, 'middleware', 'getHotelLogo'))

//- utils
const getCurrentDate = require(path.join(__basedir, 'utils', 'getCurrentDate'))
const formatDate = require(path.join(__basedir, 'utils', 'formatDate'))
const capitalizeFirstLetter = require(path.join(__basedir, 'utils', 'capitalizeFirstLetter'))
const { formatCurrency } = require(path.join(__basedir, 'utils', 'formatCurrency'))
const { getDate365DaysAgo, 
    getDate30DaysAgo, 
    getDate7DaysAgo, 
    getDate1DayAgo } = require(path.join(__basedir, 'utils', 'getDateDaysAgo'))


const puppeteer = require('puppeteer');
const pug = require('pug');



//- image
const fs = require('fs')
const multer = require('multer')
const { type } = require('os')
const upload = multer({ dest: 'uploads/' })

// const { createGuestInHouse } = require(path.join(__basedir, 'services', 'pdf-guestinhouse'))
// const { createPdf } = require(path.join(__basedir, 'services', 'createPdf'))
const { createReport } = require(path.join(__basedir, 'services', 'createReport'))


//- occupancy report
router.get('/occupancyReport', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    const hotelID = req.session.hotelID

    //- count per guest type
    const q1 = `
        SELECT
            CASE
                WHEN reservationdate IS NULL THEN 'Walk-in'
                ELSE 'Reservation'
            END AS guest_type,
            COUNT(*) AS guest_count
        FROM
            hist_guestaccounts
        WHERE hotelid = $1
        GROUP BY
            guest_type;
    `
    const q1result = await pool.query(q1, [hotelID])


    //- count per room type
    const q2 = `
        SELECT roomtype, COUNT(roomtype) AS roomtype_count 
        FROM hist_guestaccounts
        WHERE hotelid = $1
        GROUP BY roomtype
        ORDER BY roomtype_count DESC;
    `
    const q2result = await pool.query(q2, [hotelID])

    //- occupancy per day
    const q3 = `
        SELECT
            all_days.day_of_week,
            COUNT(hist_guestaccounts.checkindate) AS checkin_count
        FROM
            (SELECT 'Sunday' AS day_of_week, 0 AS day_order
            UNION SELECT 'Monday', 1
            UNION SELECT 'Tuesday', 2
            UNION SELECT 'Wednesday', 3
            UNION SELECT 'Thursday', 4
            UNION SELECT 'Friday', 5
            UNION SELECT 'Saturday', 6) AS all_days
        LEFT JOIN
            hist_guestaccounts ON all_days.day_of_week = 
            CASE
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 0 THEN 'Sunday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 1 THEN 'Monday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 2 THEN 'Tuesday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 3 THEN 'Wednesday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 4 THEN 'Thursday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 5 THEN 'Friday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 6 THEN 'Saturday'
            END
        WHERE hotelid = $1
        GROUP BY
            all_days.day_of_week
        ORDER BY
            checkin_count DESC;
    `
    const q3result = await pool.query(q3, [hotelID])

    //- occupancy per month
    const q4 = `
        SELECT
            all_months.month_name,
            COALESCE(COUNT(hist_guestaccounts.checkindate), 0) AS checkin_count
        FROM
            (SELECT 'January' AS month_name, 1 AS month_order
            UNION SELECT 'February', 2
            UNION SELECT 'March', 3
            UNION SELECT 'April', 4
            UNION SELECT 'May', 5
            UNION SELECT 'June', 6
            UNION SELECT 'July', 7
            UNION SELECT 'August', 8
            UNION SELECT 'September', 9
            UNION SELECT 'October', 10
            UNION SELECT 'November', 11
            UNION SELECT 'December', 12) AS all_months
        LEFT JOIN
            hist_guestaccounts ON all_months.month_name = 
            CASE
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 1 THEN 'January'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 2 THEN 'February'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 3 THEN 'March'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 4 THEN 'April'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 5 THEN 'May'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 6 THEN 'June'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 7 THEN 'July'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 8 THEN 'August'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 9 THEN 'September'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 10 THEN 'October'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 11 THEN 'November'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 12 THEN 'December'
            END
        WHERE hotelid = $1
        GROUP BY
            all_months.month_name
        ORDER BY
            checkin_count DESC;
    `
    const q4result = await pool.query(q4, [hotelID])

    // Occupancy all count
    const q5 = `
        SELECT COUNT(*)
        FROM hist_guestaccounts
        WHERE hotelid = $1;
    `
    const q5result = await pool.query(q5, [hotelID])
    const allOccupancy = q5result.rows[0].count

    // Day with highest occupancy
    const q6 = `
        SELECT
            all_days.day_of_week
        FROM
            (SELECT 'Sunday' AS day_of_week, 0 AS day_order
            UNION SELECT 'Monday', 1
            UNION SELECT 'Tuesday', 2
            UNION SELECT 'Wednesday', 3
            UNION SELECT 'Thursday', 4
            UNION SELECT 'Friday', 5
            UNION SELECT 'Saturday', 6) AS all_days
        LEFT JOIN
            hist_guestaccounts ON all_days.day_of_week = 
            CASE
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 0 THEN 'Sunday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 1 THEN 'Monday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 2 THEN 'Tuesday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 3 THEN 'Wednesday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 4 THEN 'Thursday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 5 THEN 'Friday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 6 THEN 'Saturday'
            END
        WHERE hotelid = $1
        GROUP BY
            all_days.day_of_week
        ORDER BY
            COUNT(hist_guestaccounts.checkindate) DESC
        LIMIT 1;
    `
    const q6result = await pool.query(q6, [hotelID])
    const highestDay = q6result.rows[0].day_of_week

    // Month with highest occupancy
    const q7 = `
        SELECT
            all_months.month_name
        FROM
            (SELECT 'January' AS month_name, 1 AS month_order
            UNION SELECT 'February', 2
            UNION SELECT 'March', 3
            UNION SELECT 'April', 4
            UNION SELECT 'May', 5
            UNION SELECT 'June', 6
            UNION SELECT 'July', 7
            UNION SELECT 'August', 8
            UNION SELECT 'September', 9
            UNION SELECT 'October', 10
            UNION SELECT 'November', 11
            UNION SELECT 'December', 12) AS all_months
        LEFT JOIN
            hist_guestaccounts ON all_months.month_name = 
            CASE
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 1 THEN 'January'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 2 THEN 'February'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 3 THEN 'March'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 4 THEN 'April'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 5 THEN 'May'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 6 THEN 'June'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 7 THEN 'July'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 8 THEN 'August'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 9 THEN 'September'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 10 THEN 'October'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 11 THEN 'November'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 12 THEN 'December'
            END
        WHERE hotelid = $1
        GROUP BY
            all_months.month_name
        ORDER BY
            COUNT(hist_guestaccounts.checkindate) DESC
        LIMIT 1;
    `
    const q7result = await pool.query(q7, [hotelID])
    const highestMonth = q7result.rows[0].month_name

    //all guests checkedout
    const q8 = `
        SELECT hgg.fullname, roomtype, roomnum, checkindate, checkoutdate, numofdays 
        FROM hist_guestaccounts hg 
        JOIN hist_guestaccounts_guestdetails hgg 
        ON hg.accountid = hgg.accountid
        WHERE hg.hotelid = $1;
    `
    const q8result = await pool.query(q8, [hotelID])

    q8result.rows.forEach((r)=>{
        if(r.checkindate){
            r.checkindate = formatDate(r.checkindate)
        }
        if(r.checkoutdate){
            r.checkoutdate = formatDate(r.checkoutdate)
        }
    })


    res.render('HSA/reports/occupancyReport', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        guesttype: q1result.rows,
        roomtype: q2result.rows,
        perDay: q3result.rows,
        perMonth: q4result.rows,
        allOccupancy: allOccupancy,
        highestDay: highestDay,
        highestMonth: highestMonth,
        allGuests: q8result.rows
    })
})

router.get('/dloccupancyReport', isAuthenticated, async(req, res)=>{
    const hotelID = req.session.hotelID

    //- count per guest type
    const q1 = `
        SELECT
            CASE
                WHEN reservationdate IS NULL THEN 'Walk-in'
                ELSE 'Reservation'
            END AS guest_type,
            COUNT(*) AS guest_count
        FROM
            hist_guestaccounts
        WHERE hotelid = $1
        GROUP BY
            guest_type;
    `
    const q1result = await pool.query(q1, [hotelID])


    //- count per room type
    const q2 = `
        SELECT roomtype, COUNT(roomtype) AS roomtype_count 
        FROM hist_guestaccounts
        WHERE hotelid = $1
        GROUP BY roomtype
        ORDER BY roomtype_count DESC;
    `
    const q2result = await pool.query(q2, [hotelID])

    //- occupancy per day
    const q3 = `
        SELECT
            all_days.day_of_week,
            COUNT(hist_guestaccounts.checkindate) AS checkin_count
        FROM
            (SELECT 'Sunday' AS day_of_week, 0 AS day_order
            UNION SELECT 'Monday', 1
            UNION SELECT 'Tuesday', 2
            UNION SELECT 'Wednesday', 3
            UNION SELECT 'Thursday', 4
            UNION SELECT 'Friday', 5
            UNION SELECT 'Saturday', 6) AS all_days
        LEFT JOIN
            hist_guestaccounts ON all_days.day_of_week = 
            CASE
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 0 THEN 'Sunday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 1 THEN 'Monday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 2 THEN 'Tuesday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 3 THEN 'Wednesday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 4 THEN 'Thursday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 5 THEN 'Friday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 6 THEN 'Saturday'
            END
        WHERE hotelid = $1
        GROUP BY
            all_days.day_of_week
        ORDER BY
            checkin_count DESC;
    `
    const q3result = await pool.query(q3, [hotelID])

    //- occupancy per month
    const q4 = `
        SELECT
            all_months.month_name,
            COALESCE(COUNT(hist_guestaccounts.checkindate), 0) AS checkin_count
        FROM
            (SELECT 'January' AS month_name, 1 AS month_order
            UNION SELECT 'February', 2
            UNION SELECT 'March', 3
            UNION SELECT 'April', 4
            UNION SELECT 'May', 5
            UNION SELECT 'June', 6
            UNION SELECT 'July', 7
            UNION SELECT 'August', 8
            UNION SELECT 'September', 9
            UNION SELECT 'October', 10
            UNION SELECT 'November', 11
            UNION SELECT 'December', 12) AS all_months
        LEFT JOIN
            hist_guestaccounts ON all_months.month_name = 
            CASE
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 1 THEN 'January'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 2 THEN 'February'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 3 THEN 'March'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 4 THEN 'April'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 5 THEN 'May'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 6 THEN 'June'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 7 THEN 'July'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 8 THEN 'August'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 9 THEN 'September'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 10 THEN 'October'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 11 THEN 'November'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 12 THEN 'December'
            END
        WHERE hotelid = $1
        GROUP BY
            all_months.month_name
        ORDER BY
            checkin_count DESC;
    `
    const q4result = await pool.query(q4, [hotelID])

    // Occupancy all count
    const q5 = `
        SELECT COUNT(*)
        FROM hist_guestaccounts
        WHERE hotelid = $1;
    `
    const q5result = await pool.query(q5, [hotelID])
    const allOccupancy = q5result.rows[0].count

    // Day with highest occupancy
    const q6 = `
        SELECT
            all_days.day_of_week
        FROM
            (SELECT 'Sunday' AS day_of_week, 0 AS day_order
            UNION SELECT 'Monday', 1
            UNION SELECT 'Tuesday', 2
            UNION SELECT 'Wednesday', 3
            UNION SELECT 'Thursday', 4
            UNION SELECT 'Friday', 5
            UNION SELECT 'Saturday', 6) AS all_days
        LEFT JOIN
            hist_guestaccounts ON all_days.day_of_week = 
            CASE
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 0 THEN 'Sunday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 1 THEN 'Monday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 2 THEN 'Tuesday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 3 THEN 'Wednesday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 4 THEN 'Thursday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 5 THEN 'Friday'
                WHEN EXTRACT(DOW FROM hist_guestaccounts.checkindate) = 6 THEN 'Saturday'
            END
        WHERE hotelid = $1
        GROUP BY
            all_days.day_of_week
        ORDER BY
            COUNT(hist_guestaccounts.checkindate) DESC
        LIMIT 1;
    `
    const q6result = await pool.query(q6, [hotelID])
    const highestDay = q6result.rows[0].day_of_week

    // Month with highest occupancy
    const q7 = `
        SELECT
            all_months.month_name
        FROM
            (SELECT 'January' AS month_name, 1 AS month_order
            UNION SELECT 'February', 2
            UNION SELECT 'March', 3
            UNION SELECT 'April', 4
            UNION SELECT 'May', 5
            UNION SELECT 'June', 6
            UNION SELECT 'July', 7
            UNION SELECT 'August', 8
            UNION SELECT 'September', 9
            UNION SELECT 'October', 10
            UNION SELECT 'November', 11
            UNION SELECT 'December', 12) AS all_months
        LEFT JOIN
            hist_guestaccounts ON all_months.month_name = 
            CASE
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 1 THEN 'January'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 2 THEN 'February'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 3 THEN 'March'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 4 THEN 'April'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 5 THEN 'May'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 6 THEN 'June'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 7 THEN 'July'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 8 THEN 'August'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 9 THEN 'September'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 10 THEN 'October'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 11 THEN 'November'
                WHEN EXTRACT(MONTH FROM hist_guestaccounts.checkindate) = 12 THEN 'December'
            END
        WHERE hotelid = $1
        GROUP BY
            all_months.month_name
        ORDER BY
            COUNT(hist_guestaccounts.checkindate) DESC
        LIMIT 1;
    `
    const q7result = await pool.query(q7, [hotelID])
    const highestMonth = q7result.rows[0].month_name

    //all guests checkedout
    const q8 = `
        SELECT hgg.fullname, roomtype, roomnum, checkindate, checkoutdate, numofdays 
        FROM hist_guestaccounts hg 
        JOIN hist_guestaccounts_guestdetails hgg 
        ON hg.accountid = hgg.accountid
        WHERE hg.hotelid = $1;
    `
    const q8result = await pool.query(q8, [hotelID])

    q8result.rows.forEach((r)=>{
    if(r.checkindate){
        r.checkindate = formatDate(r.checkindate)
    }
    if(r.checkoutdate){
        r.checkoutdate = formatDate(r.checkoutdate)
    }
    })

    //- q5
    const q9result = await pool.query(`
        SELECT 
            hotelname, 
            hotellocation
        FROM hotels
        WHERE hotelid = $1
    `, [hotelID])
    
    //- data
    const data1 = q1result.rows
    const data2 = q2result.rows
    const data3 = q3result.rows
    const data4 = q4result.rows
    const data5 = q8result.rows

    //- hotel
    const hotel = q9result.rows[0] 

    /*const pass = {
        hotel: hotel,
        reportTitle: "Occupancy Report",
        overviewTitles: {
            title1: "Total Number of Occupancy:",
            title2: "Day with Highest Occupancy:",
            title3: "Month with Highest Occupancy:",
            title4: "Date Today:"
        },
        overview: {
            overview1: allOccupancy,
            overview2: highestDay,
            overview3: highestMonth,
            overview4: getCurrentDate()
        },
        headers: ["Guest Name", "Room Type", "Room Number", "Check-in Date", "Check-out Date", "Number of Days"],
        data: data5
    }

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `OccupancyReport.pdf`
    })

    createReport(
        (chunk) => stream.write(chunk),
        () => stream.end(),
        pass
    )*/

    // render the Pug template to HTML
    const html = pug.renderFile('views/HSA/reports/occupancy.pug', {
        // pass the data needed by the template
        hotel: hotel,
        guesttype: q1result.rows,
        roomtype: q2result.rows,
        perDay: q3result.rows,
        perMonth: q4result.rows,
        allOccupancy: allOccupancy,
        highestDay: highestDay,
        highestMonth: highestMonth,
        allGuests: q8result.rows,
        date: getCurrentDate() 
    });

    // create a new browser instance
    const browser = await puppeteer.launch();

    // create a new page in the browser
    const page = await browser.newPage();

    // set the HTML content of the page
    await page.setContent(html);

    // generate a PDF from the page content
    const pdf = await page.pdf({ format: 'Legal', landscape: true });

    // close the browser
    await browser.close();

    // set the response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=occupancyReport.pdf');

    // send the generated PDF
    res.send(pdf);
})



//- reservation summary report
router.get('/reservationSummary', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    const hotelID = req.session.hotelID

    //- select all reservationhistory
    const q1 = `
        SELECT *, t1.status FROM hist_reservations t1
        LEFT JOIN hist_reservation_guestdetails t2
            ON t1.reservationid = t2.reservationid
        LEFT JOIN rooms t3
            ON t1.roomid = t3.roomid
        LEFT JOIN room_type t4
            ON t1.typeid = t4.typeid
        WHERE t1.hotelid = $1
        ORDER BY t1.checkindate DESC
    `
    const q1result = await pool.query(q1, [hotelID])

    q1result.rows.forEach((r)=>{
        if(r.checkindate){
            r.checkindate = formatDate(r.checkindate)
        }
        if(r.checkoutdate){
            r.checkoutdate = formatDate(r.checkoutdate)
        }
        if(r.reservationdate){
            r.reservationdate = formatDate(r.reservationdate)
        }
    })

    //- overall count of reservations
    const q2 = `
        SELECT COUNT(*)
        FROM hist_reservations
        WHERE hotelid = $1;
    `
    const q2result = await pool.query(q2, [hotelID])
    const reservationAllCount = q2result.rows[0].count

    //- overall count of checked-in reservation
    const q3 = `
        SELECT COUNT(*)
        FROM hist_reservations
        WHERE hotelid = $1
        AND status = $2;
    `
    const q3result = await pool.query(q3, [hotelID, 'Checked-in'])
    const checkedinCount = q3result.rows[0].count

    //- overall count of cancelled reservations
    const q4 = `
        SELECT COUNT(*)
        FROM hist_reservations
        WHERE hotelid = $1
        AND status = $2;
    `
    const q4result = await pool.query(q4, [hotelID, 'Cancelled'])
    const cancelledCount = q4result.rows[0].count


    res.render('HSA/reports/reservationSummary', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        reservation: q1result.rows,
        reservationAllCount: reservationAllCount,
        checkedinCount: checkedinCount,
        cancelledCount: cancelledCount
    })
})

router.get('/dlreservationSummary', isAuthenticated, async(req, res)=>{
    const hotelID = req.session.hotelID


    //- select all reservationhistory
    const q1 = `
        SELECT
            t1.reservationid,
            t2.fullname,
            t4.roomtype,
            t3.roomnum,
            t1.reservationdate,
            t1.status 
        FROM hist_reservations t1
        LEFT JOIN hist_reservation_guestdetails t2
            ON t1.reservationid = t2.reservationid
        LEFT JOIN rooms t3
            ON t1.roomid = t3.roomid
        LEFT JOIN room_type t4
            ON t1.typeid = t4.typeid
        WHERE t1.hotelid = $1
        ORDER BY t1.checkindate DESC
    `
    const q1result = await pool.query(q1, [hotelID])

    q1result.rows.forEach((r)=>{
        if(r.checkindate){
            r.checkindate = formatDate(r.checkindate)
        }
        if(r.checkoutdate){
            r.checkoutdate = formatDate(r.checkoutdate)
        }
        if(r.reservationdate){
            r.reservationdate = formatDate(r.reservationdate)
        }
    })

    //- overall count of reservations
    const q2 = `
        SELECT COUNT(*)
        FROM hist_reservations
        WHERE hotelid = $1;
    `
    const q2result = await pool.query(q2, [hotelID])
    const reservationAllCount = q2result.rows[0].count

    //- overall count of checked-in reservation
    const q3 = `
        SELECT COUNT(*)
        FROM hist_reservations
        WHERE hotelid = $1
        AND status = $2;
    `
    const q3result = await pool.query(q3, [hotelID, 'Checked-in'])
    const checkedinCount = q3result.rows[0].count

    //- overall count of cancelled reservations
    const q4 = `
        SELECT COUNT(*)
        FROM hist_reservations
        WHERE hotelid = $1
        AND status = $2;
    `
    const q4result = await pool.query(q4, [hotelID, 'Cancelled'])
    const cancelledCount = q4result.rows[0].count

    //- q5
    const q5result = await pool.query(`
        SELECT 
            hotelname, 
            hotellocation
        FROM hotels
        WHERE hotelid = $1
    `, [hotelID])
    
    //- data
    const data = q1result.rows

    //- hotel
    const hotel = q5result.rows[0] 

    const pass = {
        hotel: hotel,
        reportTitle: "Reservation Summary Report",
        overviewTitles: {
            title1: "Total Number of Reservation:",
            title2: "Total Number of Successful Reservation:",
            title3: "Total Number of Cancelled Reservation:",
            title4: "Date Today:"
        },
        overview: {
            overview1: reservationAllCount,
            overview2: checkedinCount,
            overview3: cancelledCount,
            overview4: getCurrentDate()
        },
        headers: ["Reservation ID", "Guest Name", "Room Type", "Room Number", "Reservation Date", "Status"],
        data: data
    }

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `ReservationSummary.pdf`
    })

    createReport(
        (chunk) => stream.write(chunk),
        () => stream.end(),
        pass
    )
})



//- guest in-house report
router.get('/guestInHouse', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    const hotelID = req.session.hotelID

    const q1 = `
        SELECT 
            t3.roomnum,
            t2.fullname,
            t1.adultno,
            t1.childno,
            t1.checkindate,
            t1.checkoutdate
        FROM guestaccounts t1
        JOIN guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN rooms t3
            ON t1.roomid = t3.roomid
        WHERE t1.hotelid = $1
    `
    const q1result = await pool.query(q1, [hotelID])

    q1result.rows.forEach((ga)=>{
        if(ga.checkindate){
            ga.checkindate = formatDate(ga.checkindate)
        }
        if(ga.checkoutdate){
            ga.checkoutdate = formatDate(ga.checkoutdate)
        }
    })

    //- q2
    //- get adult no (hist)
    const q2 = `
        SELECT adultno
        FROM guestaccounts
        WHERE hotelid = $1
    `
    const q2result = await pool.query(q2, [hotelID])
    let adultNoCount = 0
    q2result.rows.forEach(row => {
        adultNoCount += row.adultno
    })

    //- q3
    //- get child no (hist)
    const q3 = `
        SELECT childno
        FROM guestaccounts
        WHERE hotelid = $1
    `
    const q3result = await pool.query(q3, [hotelID])
    let childNoCount = 0
    q3result.rows.forEach(row => {
        childNoCount += row.childno
    })
    
    //- total in-house guests
    const totalInHouseGuests = adultNoCount + childNoCount

    //- q4
    //- get adult no
    const q4 = `
        SELECT adultno
        FROM guestaccounts
        WHERE hotelid = $1
    `
    const q4result = await pool.query(q4, [hotelID])
    let total_adultNoCount = 0
    q4result.rows.forEach(row => {
        total_adultNoCount += row.adultno
    })

    //- q5
    //- get child no
    const q5 = `
        SELECT childno
        FROM guestaccounts
        WHERE hotelid = $1
    `
    const q5result = await pool.query(q5, [hotelID])
    let total_childNoCount = 0
    q5result.rows.forEach(row => {
        total_childNoCount += row.childno
    })

    res.render('HSA/reports/guestInHouse', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        dataArray: q1result.rows,
        totalInHouseGuests: totalInHouseGuests,
        total_adultNoCount: total_adultNoCount,
        total_childNoCount: total_childNoCount
    })
})

router.get('/dlGuestInHouse', isAuthenticated, async(req, res)=>{
    const hotelID = req.session.hotelID


    //- q1
    //- query to get data (in-house guests)
    const q1result = await pool.query(`
        SELECT 
            t3.roomnum,
            t2.fullname,
            t1.adultno,
            t1.childno,
            t1.checkindate,
            t1.checkoutdate
        FROM guestaccounts t1
        JOIN guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN rooms t3
            ON t1.roomid = t3.roomid
        WHERE t1.hotelid = $1
    `, [hotelID])

    //- format check-in and check-out date
    q1result.rows.forEach((ga)=>{
        if(ga.checkindate){
            ga.checkindate = formatDate(ga.checkindate)
        }
        if(ga.checkoutdate){
            ga.checkoutdate = formatDate(ga.checkoutdate)
        }
    })


    //- q2
    //- get adult no

    const q2result = await pool.query(`
        SELECT adultno
        FROM guestaccounts
        WHERE hotelid = $1
    `, [hotelID])

    let adultNoCount = 0
    q2result.rows.forEach(row => {
        adultNoCount += row.adultno
    })

    //- q3
    //- get child no
    const q3result = await pool.query(`
        SELECT childno
        FROM guestaccounts
        WHERE hotelid = $1
    `, [hotelID])

    let childNoCount = 0
    q3result.rows.forEach(row => {
        childNoCount += row.childno
    })

    //- q4
    const q4result = await pool.query(`
        SELECT 
            hotelname, 
            hotellocation
        FROM hotels
        WHERE hotelid = $1
    `, [hotelID])
    


    //- data
    const data = q1result.rows

    //- total in-house guests
    const totalInHouseGuests = adultNoCount + childNoCount

    //- hotel
    const hotel = q4result.rows[0]


    const pass = {
        hotel: hotel,
        reportTitle: "Guests In-House Report",
        overviewTitles: {
            title1: "Total In-House Guests:",
            title2: "Total Number of Adults:",
            title3: "Total Number of Children:",
            title4: "Date Today:"
        },
        overview: {
            overview1: totalInHouseGuests,
            overview2: adultNoCount,
            overview3: childNoCount,
            overview4: getCurrentDate()
        },
        headers: ["Room Number", "Guest Name", "No. of Adult", "No. of Child", "Check-In Date", "Check-Out Date"],
        data: data
    }

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `GuestInHouse.pdf`
    })

    createReport(
        (chunk) => stream.write(chunk),
        () => stream.end(),
        pass
    )
})


//- revenue
router.get('/revenue', isAuthenticated, getHotelColor, getHotelLogo, async(req,res)=>{
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

    res.render('HSA/reports/revenue', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        dataArray: data,
        summary: summary
    })
})

router.get('/dlRevenue', isAuthenticated, getHotelColor, getHotelLogo, async(req,res)=>{
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

    //- q2
    const q2result = await pool.query(`
        SELECT 
            hotelname, 
            hotellocation
        FROM hotels
        WHERE hotelid = $1
    `, [hotelID])

    //- hotel
    const hotel = q2result.rows[0]

    const pass = {
        hotel: hotel,
        reportTitle: "Revenue Report",
        overviewTitles: {
            title1: "Total Revenue:",
            title2: "Highest Occupancy Rate:",
            title3: "Highest Percentage of Revenue:",
            title4: "Date Today:",
            title5: "Range:"
        },
        overview: {
            overview1: summary.totalRevenue,
            overview2: summary.highestOccupancyRateRoomType,
            overview3: summary.highestPercentageOfRevenueRoomType,
            overview4: getCurrentDate(),
            overview5: range
        },
        headers: ["Room Type", "Number of Rooms", "Number of Check-Ins", "Occupancy Rate", "Revenue", "Percentage of Revenue"],
        data: data
    }

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `GuestInHouse.pdf`
    })

    createReport(
        (chunk) => stream.write(chunk),
        () => stream.end(),
        pass
    )
})


//- promos summary
router.get('/promosSummary', getHotelColor, getHotelLogo, async(req, res)=>{
    const hotelID = req.session.hotelID
    const { status, typeid } = req.query
 
    const q1 = `
        SELECT * FROM room_type
        WHERE hotelid = $1
        ORDER BY price ASC
    `
    const q1result = await pool.query(q1, [hotelID])

    const q2 = `
        SELECT * 
        FROM promos t1
        JOIN room_type t2
            ON t1.typeid = t2.typeid
        WHERE t1.hotelid = $1
    `
    const q2result = await pool.query(q2, [hotelID])

    q2result.rows.forEach(row=>{
        if(row.startdate){
            row.startdate = formatDate(row.startdate)
        }
        if(row.enddate){
            row.enddate = formatDate(row.enddate)
        }
    })

    let data = []

    //- there is a STATUS and TYPEID filter
    if(status && typeid){
        const filteredData = q2result.rows.filter(row => {
            return row.status == capitalizeFirstLetter(status) && row.typeid == typeid
        })
        // console.log(filteredData)
        data = filteredData
    } 

    //- there is a STATUS filter
    else if(status && !typeid){
        const filteredData = q2result.rows.filter(row => {
            return row.status == capitalizeFirstLetter(status)
        })
        data = filteredData
    }

    //- there is a TYPEID filter
    else if(!status && typeid){
        const filteredData = q2result.rows.filter(row => {
            return row.typeid == typeid
        })
        data = filteredData
    }

    //- there is NO filter
    else{
        data = q2result.rows
    }

    let activeCount
    let inactiveCount
    let timesAvailed = 0

    // console.log(typeid)
    if(typeid){
        const result1 = await pool.query(`
            SELECT COUNT(*)
            FROM promos
            WHERE hotelid = $1 AND
                status = $2 AND
                typeid = $3
        `, [hotelID, 'Active', typeid])

        //- result.rows.count
        activeCount = result1.rows[0].count


        const result2 = await pool.query(`
            SELECT COUNT(*)
            FROM promos
            WHERE hotelid = $1 AND
                status = $2 AND
                typeid = $3
        `, [hotelID, 'Inactive', typeid])

        //- result.rows.count
        inactiveCount = result2.rows[0].count

        const result3 = await pool.query(`
            SELECT timesavailed
            FROM promos
            WHERE hotelid = $1 AND
                typeid = $2
        `, [hotelID, typeid])

        result3.rows.forEach((row)=>{
            timesAvailed += row.timesavailed
        })
    }
    else{
        const result1 = await pool.query(`
            SELECT COUNT(*)
            FROM promos
            WHERE hotelid = $1 AND
                status = $2
        `, [hotelID, 'Active'])

        //- result.rows.count
        activeCount = result1.rows[0].count


        const result2 = await pool.query(`
            SELECT COUNT(*)
            FROM promos
            WHERE hotelid = $1 AND
                status = $2
        `, [hotelID, 'Inactive'])

        //- result.rows.count
        inactiveCount = result2.rows[0].count

        const result3 = await pool.query(`
            SELECT timesavailed
            FROM promos
            WHERE hotelid = $1
        `, [hotelID])

        result3.rows.forEach((row)=>{
            timesAvailed += row.timesavailed
        })
    }

    res.render('HSA/reports/promosSummary', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        allRoomTypeArray: q1result.rows,
        dataArray: data,
        activeCount: activeCount,
        inactiveCount: inactiveCount,
        timesAvailed: timesAvailed
    })
})

router.get('/dlPromosSummary', isAuthenticated, async(req, res)=>{
    const hotelID = req.session.hotelID
    const { status, typeid } = req.query

    //- q1
    //- select all promos
    const q1result = await pool.query(`
        SELECT 
            t1.code,
            t1.name,
            t1.discount,
            t1.startdate,
            t1.enddate,
            t1.timesavailed,
            t1.status,
            t1.typeid,
            t2.roomtype
        FROM promos t1
        JOIN room_type t2
            ON t1.typeid = t2.typeid
        WHERE t1.hotelid = $1
    `, [hotelID])

    //- format start and end date
    q1result.rows.forEach(row=>{
        if(row.startdate){
            row.startdate = formatDate(row.startdate)
        }
        if(row.enddate){
            row.enddate = formatDate(row.enddate)
        }
    })

    let data = []

    //- there is a STATUS and TYPEID filter
    if(status && typeid){
        const filteredData = q1result.rows.filter(row => {
            return row.status == capitalizeFirstLetter(status) && row.typeid == typeid
        })
        data = filteredData.map(row => {
            return {
                code: row.code,
                name: row.name,
                discount: row.discount,
                roomtype: row.roomtype,
                startdate: row.startdate,
                enddate: row.enddate,
                timesavailed: row.timesavailed
            }
        })
    } 

    //- there is a STATUS filter
    else if(status && !typeid){
        const filteredData = q1result.rows.filter(row => {
            return row.status == capitalizeFirstLetter(status)
        })
        data = filteredData.map(row => {
            return {
                code: row.code,
                name: row.name,
                discount: row.discount,
                roomtype: row.roomtype,
                startdate: row.startdate,
                enddate: row.enddate,
                timesavailed: row.timesavailed
            }
        })
    }

    //- there is a TYPEID filter
    else if(!status && typeid){
        const filteredData = q1result.rows.filter(row => {
            return row.typeid == typeid
        })
        data = filteredData.map(row => {
            return {
                code: row.code,
                name: row.name,
                discount: row.discount,
                roomtype: row.roomtype,
                startdate: row.startdate,
                enddate: row.enddate,
                timesavailed: row.timesavailed
            }
        })
    }

    //- there is NO filter
    else{
        data = q1result.rows.map(row => {
            return {
                code: row.code,
                name: row.name,
                discount: row.discount,
                roomtype: row.roomtype,
                startdate: row.startdate,
                enddate: row.enddate,
                timesavailed: row.timesavailed
            }
        })
    }

    let activeCount
    let inactiveCount
    let timesAvailed = 0

    if(typeid){
        const result1 = await pool.query(`
            SELECT COUNT(*)
            FROM promos
            WHERE hotelid = $1 AND
                status = $2 AND
                typeid = $3
        `, [hotelID, 'Active', typeid])

        //- result.rows.count
        activeCount = result1.rows[0].count


        const result2 = await pool.query(`
            SELECT COUNT(*)
            FROM promos
            WHERE hotelid = $1 AND
                status = $2 AND
                typeid = $3
        `, [hotelID, 'Inactive', typeid])

        //- result.rows.count
        inactiveCount = result2.rows[0].count

        const result3 = await pool.query(`
            SELECT timesavailed
            FROM promos
            WHERE hotelid = $1 AND
                typeid = $2
        `, [hotelID, typeid])

        result3.rows.forEach((row)=>{
            timesAvailed += row.timesavailed
        })
    }
    else{
        const result1 = await pool.query(`
            SELECT COUNT(*)
            FROM promos
            WHERE hotelid = $1 AND
                status = $2
        `, [hotelID, 'Active'])

        //- result.rows.count
        activeCount = result1.rows[0].count


        const result2 = await pool.query(`
            SELECT COUNT(*)
            FROM promos
            WHERE hotelid = $1 AND
                status = $2
        `, [hotelID, 'Inactive'])

        //- result.rows.count
        inactiveCount = result2.rows[0].count

        const result3 = await pool.query(`
            SELECT timesavailed
            FROM promos
            WHERE hotelid = $1
        `, [hotelID])

        result3.rows.forEach((row)=>{
            timesAvailed += row.timesavailed
        })
    }

    //- q2
    const q2result = await pool.query(`
        SELECT 
            hotelname, 
            hotellocation
        FROM hotels
        WHERE hotelid = $1
    `, [hotelID])

    //- hotel
    const hotel = q2result.rows[0]

    const pass = {
        hotel: hotel,
        reportTitle: "Promos Summary Report:",
        overviewTitles: {
            title1: "Number of Active Promos:",
            title2: "Number of Inactive Promos:",
            title3: "Times Availed:",
            title4: "Date Today:",
        },
        overview: {
            overview1: activeCount,
            overview2: inactiveCount,
            overview3: timesAvailed,
            overview4: getCurrentDate()
        },
        headers: ["Promo Code", "Promo Name", "Discount", "Room Type", "Start Date", "End Date", "Times Availed"],
        data: data
    }

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `GuestInHouse.pdf`
    })

    createReport(
        (chunk) => stream.write(chunk),
        () => stream.end(),
        pass
    )
})




module.exports = router