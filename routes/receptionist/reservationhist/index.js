//- path import
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- middlewares
const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))
const getHotelLogo = require(path.join(__basedir, 'middleware', 'getHotelLogo'))

//- utils
const formatDate = require(path.join(__basedir, 'utils', 'formatDate'))



//- archived

//- render "list" page
//- "/reservationhist"
router.get('/', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    const hotelid = req.session.hotelID

    //- select all reservationhistory
    const q1 = `
        SELECT * FROM hist_reservations t1
        JOIN hist_reservation_guestdetails t2
            ON t1.reservationid = t2.reservationid
        JOIN rooms t3
            ON t1.roomid = t3.roomid
        JOIN room_type t4
            ON t1.typeid = t4.typeid
        WHERE t1.hotelid = $1
    `
    const q1result = await pool.query(q1, [hotelid])

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

    res.render('receptionist/reservationhist/list', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        reservation: q1result.rows
    })
})


//- render "detail" page
//- "/archivedga/detail/:id"
router.get('/detail/:id', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    const hotelid = req.session.hotelID
    const { id } = req.params

    const q1 = `
        SELECT * FROM hist_reservations t1
        JOIN hist_reservation_guestdetails t2
            ON t1.reservationid = t2.reservationid
        JOIN rooms t3
            ON t1.roomid = t3.roomid
        JOIN room_type t4
            ON t1.typeid = t4.typeid
        WHERE t1.reservationid = $1 AND t1.hotelid = $2
    `
    const q1result = await pool.query(q1, [id, hotelid])

    const q2result = await pool.query('SELECT status from hist_reservations WHERE reservationid = $1', [id]);

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

    res.render('receptionist/reservationhist/detail', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        r: q1result.rows[0],
        rs: q2result.rows[0]
    })
})



module.exports = router