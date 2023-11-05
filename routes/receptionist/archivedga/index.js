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

//- services
const { createInvoice } = require(path.join(__basedir, 'services', 'pdf-service'))




//- archived

//- render "list" page
//- "/archivedga"
router.get('/', isAuthenticated, getHotelColor, async(req, res)=>{
    const hotelid = req.session.hotelID

    //- select all archived guest accounts
    const q1 = `
        SELECT * FROM hist_guestaccounts t1
        JOIN hist_guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN rooms t3
            ON t1.roomid = t3.roomid
        JOIN room_type t4
            ON t1.typeid = t4.typeid
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

    res.render('receptionist/archivedga/list', {
        hotelColor: req.hotelColor,
        guestaccounts: q1result.rows
    })
})


//- render "folio" page
//- "/ga/folio/:id"
router.get('/folio/:id', isAuthenticated, getHotelColor, async(req, res)=>{

    const hotelid = req.session.hotelID
    const { id } = req.params


    //- select from "hist_transactions" table (fds)
    const q1 = `
        SELECT * FROM hist_transactions
        WHERE hotelid = $1
        AND accountid = $2
    `
    const q1result = await pool.query(q1, [hotelid, id])


    //- select from "hist_ancillary_transactions" table (ancillary)
    const q2 = `
        SELECT 
            t1.ancillary_desc,
            t2.ps_code,
            t2.price,
            t3.transaction_id,
            t3.accountid,
            t3.quantity,
            t3.amount,
            t3.paid
        FROM ancillaries t1
        JOIN product_service t2
            ON t1.ancillary_id = t2.ancillary_id
        JOIN hist_ancillary_transactions t3
            ON t2.ps_id = t3.ps_id
        WHERE t3.hotelid = $1
        AND t3.accountid = $2
    `
    const q2result = await pool.query(q2, [hotelid, id])


    //- select from "hist_housekeeping_transactions" table (housekeeping)
    const q3 = `
        SELECT 
            t1.transactionid,
            t1.paid,
            t2.description,
            t1.price,
            t1.qty,
            t1.amount
        FROM hist_housekeeping_transactions t1
        JOIN ref_items t2
            ON t1.ref_itemid = t2.ref_itemid
        WHERE t1.hotelid = $1 AND
            t1.accountid = $2
    `
    const q3result = await pool.query(q3, [hotelid, id])


    //- select from "ga" and "ga_gd" table (fds)
    const q4 = `
        SELECT *
        FROM hist_guestaccounts t1
            JOIN hist_guestaccounts_guestdetails t2
                ON t1.accountid = t2.accountid
            JOIN rooms t3
                ON t1.roomid = t3.roomid
        WHERE t1.hotelid = $1 AND 
            t1.accountid = $2
    `
    const q4result = await pool.query(q4, [hotelid, id])


    res.render('receptionist/archivedga/folio', {
        hotelColor: req.hotelColor,
        t1: q1result.rows,
        t2: q2result.rows,
        t3: q3result.rows,
        ga: q4result.rows[0]
    })

})


//- render "detail" page
//- "/archivedga/detail/:id"
router.get('/detail/:id', isAuthenticated, getHotelColor, async(req, res)=>{
    const hotelid = req.session.hotelID
    const { id } = req.params

    const q1 = `
        SELECT * FROM hist_guestaccounts t1
        JOIN hist_guestaccounts_guestdetails t2
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

    res.render('receptionist/archivedga/detail', {
        hotelColor: req.hotelColor,
        ga: q1result.rows[0]
    })
})

router.get('/invoice/:id', async(req, res)=>{

    const hotelid = req.session.hotelID
    const { id } = req.params


    //- select from "transactions" table (fds)
    const q1 = `
        SELECT * FROM hist_transactions
        WHERE hotelid = $1
        AND accountid = $2
    `
    const q1result = await pool.query(q1, [hotelid, id])

    //- select from "ancillary_transactions" table (ancillary)
    const q2 = `
        SELECT 
            t1.ancillary_desc,
            t2.ps_code,
            t2.price,
            t3.transaction_id,
            t3.accountid,
            t3.quantity,
            t3.amount,
            t3.paid
        FROM ancillaries t1
        JOIN product_service t2
            ON t1.ancillary_id = t2.ancillary_id
        JOIN hist_ancillary_transactions t3
            ON t2.ps_id = t3.ps_id
        WHERE t3.hotelid = $1
        AND t3.accountid = $2
    `
    const q2result = await pool.query(q2, [hotelid, id])

    //- select from "housekeeping_transactions" table (housekeeping)
    const q3 = `
        SELECT 
            t1.transactionid,
            t1.paid,
            t2.description,
            t1.price,
            t1.qty,
            t1.amount
        FROM hist_housekeeping_transactions t1
        JOIN ref_items t2
            ON t1.ref_itemid = t2.ref_itemid
        WHERE t1.hotelid = $1 AND
            t1.accountid = $2
    `
    const q3result = await pool.query(q3, [hotelid, id])

    //- select from "ga" and "ga_gd" table (fds)
    const q4 = `
        SELECT *
        FROM hist_guestaccounts t1
            JOIN hist_guestaccounts_guestdetails t2
                ON t1.accountid = t2.accountid
            JOIN rooms t3
                ON t1.roomid = t3.roomid
        WHERE t1.hotelid = $1 AND 
            t1.accountid = $2
    `
    const q4result = await pool.query(q4, [hotelid, id])

    //- select hotel
    const q5 = `
        SELECT 
            t1.hotelname, 
            t1.hotellocation 
        FROM hotels t1
        JOIN hist_guestaccounts t2
            ON t1.hotelid = t2.hotelid
        WHERE t2.hotelid = $1 AND
            t2.accountid = $2
    `
    const q5result = await pool.query(q5, [hotelid, id])

    //- select folio
    const q6 = `
        SELECT * 
        FROM hist_folios
        WHERE hotelid = $1 AND
            accountid = $2
    `
    const q6result = await pool.query(q6, [hotelid, id])

    const invoice = {
        hotel: {},
        account: {},
        t1: [],
        t2: [],
        t3: [],
        folio: {}
      };

    q1result.rows.forEach(t => {
        invoice.t1.push(t)
    })
    q2result.rows.forEach(t => {
        invoice.t2.push(t)
    })
    q3result.rows.forEach(t => {
        invoice.t3.push(t)
    })

    invoice.account = q4result.rows[0]
    invoice.hotel = q5result.rows[0]
    invoice.folio = q6result.rows[0]

    const accountid = q4result.rows[0].accountid
    const accountname = q4result.rows[0].fullname

    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment;filename=invoice_GA${accountid}_${accountname}.pdf`
    })

    createInvoice(
        (chunk) => stream.write(chunk),
        () => stream.end(),
        invoice
    )

})




module.exports = router