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

//- utils
const getCurrentDate = require(path.join(__basedir, 'utils', 'getCurrentDate'))
const formatDate = require(path.join(__basedir, 'utils', 'formatDate'))







//- render "new" form/page
//- "/ga/new"
router.use('/new', isAuthenticated, getHotelColor, async(req, res)=>{
    const hotelid = req.session.hotelID

    //- select all rooms of the hotel
    const getRoomsQuery = `
        SELECT * FROM rooms t1
        LEFT JOIN reservations t2
            ON t1.roomid = t2.roomid
        JOIN room_type t3
            ON t1.typeid = t3.typeid
        WHERE t1.hotelid = $1
        ORDER BY t1.roomnum ASC
    `;

    const rooms = await pool.query(getRoomsQuery, [hotelid])
    
    //- select room types of the hotel
    const getRoomTypesQuery = `
        SELECT * FROM room_type
        WHERE hotelid = $1
    `
    const roomTypes = await pool.query(getRoomTypesQuery, [hotelid])

    // //- select ancillary services
    // const getAncillariesQuery = `
    //     SELECT * FROM ancillaries
    //     WHERE ancillary_status = $1
    // `

    // const ancillaries = await pool.query(getAncillariesQuery, ['Available'])

    res.render('receptionist/guestaccounts/new', {
        hotelColor: req.hotelColor,
        roomTypes: roomTypes.rows,
        rooms: rooms.rows
    })
})

//- handle register
//- "/ga/register"
router.post('/register', async(req,res)=>{
    const hotelid = req.session.hotelID

    const { checkindate, checkoutdate, numofdays, adultno, childno,
        roomtype, roomid, promocode,
        fullname, address, email, contactno,
        modeofpayment, approvalcode, description, price, qty, amount
    } = req.body

    const date = getCurrentDate()

    //- insert to "guestaccounts" T
    const q1 = `
        INSERT INTO guestaccounts(hotelid, typeid, roomid, adultno, childno, checkindate, checkoutdate, numofdays, modeofpayment, promocode)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `
    const q1result = await pool.query(q1, [hotelid, roomtype, roomid, adultno, childno, checkindate, checkoutdate, numofdays, modeofpayment, promocode])

    //- get accountid of newly inserted record
    const accountid = q1result.rows[0].accountid

    //- insert to "guestaccount_guestdetails" T
    const q2 = `
        INSERT INTO guestaccounts_guestdetails(accountid, hotelid, fullname, email, contactno, address)
        VALUES ($1, $2, $3, $4, $5, $6)
    `
    const q2result = await pool.query(q2, [accountid, hotelid, fullname, email, contactno, address])

    //- insert to "transactions" T
    const q3 = `
        INSERT INTO transactions(hotelid, accountid, roomid, description, price, qty, amount, date, approvalcode)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    const q3result = await pool.query(q3, [hotelid, accountid, roomid, description, price, qty, amount, date, approvalcode])

    res.redirect('/ga')
})


//- render "list" page
//- "/ga"
router.get('/', isAuthenticated, getHotelColor, async(req, res)=>{
    const hotelid = req.session.hotelID

    //- select all guest accounts
    const q1 = `
        SELECT * FROM guestaccounts t1
        JOIN guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN rooms t3
            ON t1.roomid = t3.roomid
        WHERE t1.hotelid = $1
    `
    const q1result = await pool.query(q1, [hotelid])

    q1result.rows.forEach((ga)=>{
        if(ga.checkindate){
            ga.checkindate = formatDate(ga.checkindate)
        }
        if(ga.checkoutdate){
            ga.checkoutdate = formatDate(ga.checkoutdate)
        }
    })

    res.render('receptionist/guestaccounts/list', {
        hotelColor: req.hotelColor,
        guestaccounts: q1result.rows
    })
})

//- render "detail" page
//- "ga/:id"
router.get('/:id', isAuthenticated, getHotelColor, async(req, res)=>{
    const hotelid = req.session.hotelID
    const { id } = req.params

    const q1 = `
        SELECT * FROM guestaccounts t1
        JOIN guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN room_type t3 
            ON t1.typeid = t3.typeid
        JOIN rooms t4 
            ON t1.roomid = t4.roomid 
        WHERE t1.accountid = $1 AND
            t1.hotelid = $2
    `
    const q1result = await pool.query(q1, [id, hotelid])

    q1result.rows.forEach((ga)=>{
        if(ga.checkindate){
            ga.checkindate = formatDate(ga.checkindate)
        }
        if(ga.checkoutdate){
            ga.checkoutdate = formatDate(ga.checkoutdate)
        }
    })

    res.render('receptionist/guestaccounts/detail', {
        hotelColor: req.hotelColor,
        ga: q1result.rows[0]
    })
})




module.exports = router