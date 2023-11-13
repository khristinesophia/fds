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

    const q2 = `
        SELECT *
        FROM guestaccounts
        WHERE hotelid = $1
    `
    const q2result = await pool.query(q2, [hotelID])
    //- total in-house guest
    //- q2result.rowCount

    const q3 = `
        SELECT *
        FROM rooms
        WHERE hotelid = $1 AND
            status = $2 OR
            status = $3 OR
            status = $4 OR
            status = $5
    `
    const q3result = await pool.query(q3, [hotelID, 'Occupied', 'To check-out', 'Inspected', 'Recently checked-out'])
    //- total ocuppied rooms
    //- q3result.rowCount

    const q4 = `
        SELECT *
        FROM rooms
        WHERE hotelid = $1 AND
            status = $2 
    `
    const q4result = await pool.query(q4, [hotelID, 'Vacant'])
    //- total available rooms
    //- q4result.rowCount

    res.render('HSA/reports/guestInHouse', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        dataArray: q1result.rows,
        inHouse: q2result.rowCount,
        occupiedRooms: q3result.rowCount,
        availableRooms: q4result.rowCount
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

    const q2 = `
        SELECT *
        FROM guestaccounts
        WHERE hotelid = $1
    `
    const q2result = await pool.query(q2, [hotelID])
    //- total in-house guest
    //- q2result.rowCount

    const q3 = `
        SELECT *
        FROM rooms
        WHERE hotelid = $1 AND
            status = $2 OR
            status = $3 OR
            status = $4 OR
            status = $5
    `
    const q3result = await pool.query(q3, [hotelID, 'Occupied', 'To check-out', 'Inspected', 'Recently checked-out'])
    //- total ocuppied rooms
    //- q3result.rowCount

    const q4 = `
        SELECT *
        FROM rooms
        WHERE hotelid = $1 AND
            status = $2 
    `
    const q4result = await pool.query(q4, [hotelID, 'Vacant'])
    //- total available rooms
    //- q4result.rowCount

    const summary = {
        inHouse: q2result.rowCount,
        occupiedRooms: q3result.rowCount,
        availableRooms: q4result.rowCount
    }

    const q5 = `
        SELECT * FROM hotels
        WHERE hotelid = $1
    `
    const q5result = await pool.query(q5, [hotelID])

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `GuestInHouse.pdf`
    })

    createGuestInHouse(
        (chunk) => stream.write(chunk),
        () => stream.end(),
        data,
        summary,
        q5result.rows[0]
    )
})

router.get('/revenue', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{

    res.render('HSA/reports/revenue', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage
    })
})




module.exports = router