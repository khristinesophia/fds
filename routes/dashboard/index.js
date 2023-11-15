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


        res.render('dashboard/hsadmin', {
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage,
            guestAccountCount: guestAccountCount,
            vacantRoomCount: vacantRoomCount, 
            occupiedRoomCount: occupiedRoomCount,
            adultNoCount: adultNoCount,
            childNoCount: childNoCount,
            departuresArray: q6result.rows
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


        res.render('dashboard/receptionist', {
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage,
            guestAccountCount: guestAccountCount,
            vacantRoomCount: vacantRoomCount, 
            occupiedRoomCount: occupiedRoomCount,
            adultNoCount: adultNoCount,
            childNoCount: childNoCount,
            departuresArray: q6result.rows
        })
    } catch (error) {
        console.error("Error fetching data for the receptionist dashboard", error)
        res.sendStatus(500) // or render an error page, handle as needed
    }
})




module.exports = router