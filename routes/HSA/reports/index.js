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

//- image
const fs = require('fs')
const multer = require('multer')
const { type } = require('os')
const upload = multer({ dest: 'uploads/' })

// const { createGuestInHouse } = require(path.join(__basedir, 'services', 'pdf-guestinhouse'))
// const { createPdf } = require(path.join(__basedir, 'services', 'createPdf'))
const { createReport } = require(path.join(__basedir, 'services', 'createReport'))

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

//- /promosSummary
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
        SELECT * FROM promos
        WHERE hotelid = $1
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
            code,
            name,
            discount,
            startdate,
            enddate,
            timesavailed,
            status,
            typeid
        FROM promos
        WHERE hotelid = $1
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
        headers: ["Promo Code", "Promo Name", "Discount", "Start Date", "End Date", "Times Availed"],
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