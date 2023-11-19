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

//- image
const fs = require('fs')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

const { createGuestInHouse } = require(path.join(__basedir, 'services', 'pdf-guestinhouse'))

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

    const data = q1result.rows

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

    const summary = {
        inHouse: totalInHouseGuests,
        total_adultNoCount: total_adultNoCount,
        total_childNoCount: total_childNoCount
    }

    const q6 = `
        SELECT * FROM hotels
        WHERE hotelid = $1
    `
    const q6result = await pool.query(q6, [hotelID])

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `GuestInHouse.pdf`
    })

    createGuestInHouse(
        (chunk) => stream.write(chunk),
        () => stream.end(),
        data,
        summary,
        q6result.rows[0]
    )
})

router.get('/promosSummary', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{

    res.render('HSA/reports/promosSummary', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage
    })
})




module.exports = router