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
const getDate365DaysAgo = require(path.join(__basedir, 'utils', 'getDate365DaysAgo'))
const getDate30DaysAgo = require(path.join(__basedir, 'utils', 'getDate30DaysAgo'))
const getDate7DaysAgo = require(path.join(__basedir, 'utils', 'getDate7DaysAgo'))
const getDate1DayAgo = require(path.join(__basedir, 'utils', 'getDate1DayAgo'))

//- image
const fs = require('fs')
const multer = require('multer')
const { type } = require('os')
const upload = multer({ dest: 'uploads/' })

// const { createGuestInHouse } = require(path.join(__basedir, 'services', 'pdf-guestinhouse'))
// const { createPdf } = require(path.join(__basedir, 'services', 'createPdf'))
const { createReport } = require(path.join(__basedir, 'services', 'createReport'))

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
            title1: "Total In-House Guests",
            title2: "Total Number of Adults",
            title3: "Total Number of Children"
        },
        overview: {
            inHouse: totalInHouseGuests,
            total_adultNoCount: adultNoCount,
            total_childNoCount: childNoCount
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
        totalPercentageOfRevenue: 100,
        highestOccupancyRate: 0,
        highestOccupancyRateRoomType: null,
        highestPercentageOfRevenue: 0,
        highestPercentageOfRevenueRoomType: null,
    }


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

        result.rows.forEach(row=>{
            if(row.revenue){
                summary.totalRevenue += parseFloat(row.revenue)
            }
        })

        result.rows.forEach(row => {
            if(row.occupancy_rate > summary.highestOccupancyRate) {
                summary.highestOccupancyRate = row.occupancy_rate
                summary.highestOccupancyRateRoomType = row.roomtype
            }
        })

        result.rows.forEach(row => {
            if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                summary.highestPercentageOfRevenue = row.percentage_of_revenue
                summary.highestPercentageOfRevenueRoomType = row.roomtype
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

        result.rows.forEach(row=>{
            if(row.revenue){
                summary.totalRevenue += parseFloat(row.revenue)
            }
        })

        result.rows.forEach(row => {
            if(row.occupancy_rate > summary.highestOccupancyRate) {
                summary.highestOccupancyRate = row.occupancy_rate
                summary.highestOccupancyRateRoomType = row.roomtype
            }
        })

        result.rows.forEach(row => {
            if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                summary.highestPercentageOfRevenue = row.percentage_of_revenue
                summary.highestPercentageOfRevenueRoomType = row.roomtype
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

        result.rows.forEach(row=>{
            if(row.revenue){
                summary.totalRevenue += parseFloat(row.revenue)
            }
        })

        result.rows.forEach(row => {
            if(row.occupancy_rate > summary.highestOccupancyRate) {
                summary.highestOccupancyRate = row.occupancy_rate
                summary.highestOccupancyRateRoomType = row.roomtype
            }
        })

        result.rows.forEach(row => {
            if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                summary.highestPercentageOfRevenue = row.percentage_of_revenue
                summary.highestPercentageOfRevenueRoomType = row.roomtype
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

        result.rows.forEach(row=>{
            if(row.revenue){
                summary.totalRevenue += parseFloat(row.revenue)
            }
        })

        result.rows.forEach(row => {
            if(row.occupancy_rate > summary.highestOccupancyRate) {
                summary.highestOccupancyRate = row.occupancy_rate
                summary.highestOccupancyRateRoomType = row.roomtype
            }
        })

        result.rows.forEach(row => {
            if(row.percentage_of_revenue > summary.highestPercentageOfRevenue) {
                summary.highestPercentageOfRevenue = row.percentage_of_revenue
                summary.highestPercentageOfRevenueRoomType = row.roomtype
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
        reportTitle: "Promos Summary Report",
        overviewTitles: {
            title1: "Number of Active Promos",
            title2: "Number of Inactive Promos",
            title3: "Times Availed"
        },
        overview: {
            overview1: activeCount,
            overview2: inactiveCount,
            overview3: timesAvailed
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