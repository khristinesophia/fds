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
const getCurrentDate = require(path.join(__basedir, 'utils', 'getCurrentDate'))
const formatDate = require(path.join(__basedir, 'utils', 'formatDate'))
const formatDateWithTime = require(path.join(__basedir, 'utils', 'formatDateWithTime'))

//- services
const { createInvoice } = require(path.join(__basedir, 'services', 'pdf-invoice'))




//- render "new" form/page
//- "/ga/new"
router.use('/new', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
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

    //- select promos of the hotel
    const getPromosQuery = `
        SELECT * FROM promos
        WHERE hotelid = $1
    `
    const promos = await pool.query(getPromosQuery, [hotelid])

    res.render('receptionist/guestaccounts/new', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        roomTypes: roomTypes.rows,
        rooms: rooms.rows,
        promos: promos.rows
    })
})

//- handle register
//- "/ga/register"
router.post('/register', async(req,res)=>{
    try {
        const hotelid = req.session.hotelID

        const { checkindate, checkoutdate, numofdays, adultno, childno,
            roomtype, roomid, promoid, discount,
            fullname, address, email, contactno,
            modeofpayment, approvalcode, description, price, qty, amount
        } = req.body
    
        const date = getCurrentDate()
    
        //- insert to "guestaccounts" T
        const q1 = `
            INSERT INTO guestaccounts(hotelid, typeid, roomid, adultno, childno, checkindate, checkoutdate, numofdays, modeofpayment, promoid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `
        const q1result = await pool.query(q1, [hotelid, roomtype, roomid, adultno, childno, checkindate, checkoutdate, numofdays, modeofpayment, promoid])
    
        //- get accountid of newly inserted record
        const accountid = q1result.rows[0].accountid

        if(promoid != 0){
            const result = await pool.query(`
                SELECT * FROM promos
                WHERE id = $1 AND
                    hotelid = $2
            `, [promoid, hotelid])
            
            let timesavailed = result.rows[0].timesavailed
            timesavailed += 1

            await pool.query(`
                UPDATE promos
                SET timesavailed = $1
                WHERE id = $2 AND
                    hotelid = $3
            `, [timesavailed, promoid, hotelid])
        }

        //- insert to "guestaccount_guestdetails" T
        const q2 = `
            INSERT INTO guestaccounts_guestdetails(accountid, hotelid, fullname, email, contactno, address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `
        const q2result = await pool.query(q2, [accountid, hotelid, fullname, email, contactno, address])
    
        //- insert to "folios"
        const q3 = `
            INSERT INTO folios(accountid, hotelid, discount, tax, paid, settled)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `
        const q3result = await pool.query(q3, [accountid, hotelid, discount, 12, amount, false])
        
        //- get folioid of newly inserted record
        const folioid = q3result.rows[0].folioid
    
        //- insert to "transactions" T
        const q4 = `
            INSERT INTO transactions(hotelid, accountid, folioid, roomid, description, price, qty, amount, date, approvalcode, paid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `
        const q4result = await pool.query(q4, [hotelid, accountid, folioid, roomid, description, price, qty, amount, date, approvalcode, true])
    
        //- update room status to 'Occupied'
        const q5 = `
            UPDATE rooms
                SET status = $1
            WHERE roomid = $2 AND 
                hotelid = $3
        `
        const q5result = await pool.query(q5, ['Occupied', roomid, hotelid])
    
        res.redirect('/ga')
    } catch (error) {
        console.log(error.message)
    }

})




//- render "list" page
//- "/ga"
router.get('/', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    const hotelid = req.session.hotelID

    //- select all guest accounts
    const q1 = `
        SELECT * FROM guestaccounts t1
        JOIN guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN folios t3
            ON t1.accountid = t3.accountid
        JOIN rooms t4
            ON t1.roomid = t4.roomid
        JOIN room_type t5
            ON t1.typeid = t5.typeid
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
        guestaccounts: q1result.rows,
        hotelLogo: req.hotelImage
    })
})




//- room status 'Occupied' to 'To check-out'
//- "/ga/tco/:id"
router.post('/tco/:id', isAuthenticated, async(req,res)=>{

    const hotelid = req.session.hotelID
    const { id } = req.params

    const q1 = `
        UPDATE 
            rooms 
        SET 
            status = 'To check-out' 
        FROM 
            guestaccounts
        WHERE 
            rooms.roomid = guestaccounts.roomid AND
            guestaccounts.hotelid = $1 AND 
            guestaccounts.accountid = $2
    `
    const q1result = await pool.query(q1, [hotelid, id])

    const q2 = `
        SELECT *
        FROM guestaccounts
        WHERE hotelid = $1 AND
        accountid = $2
    `
    const q2result = await pool.query(q2, [hotelid, id])

    res.redirect(`/ga/info/${id}`)
})


//- store approval code for credit/debit card payments
//- "/ga/cardpayment/:id"
router.post('/cardpayment/:id', isAuthenticated, async(req,res)=>{



    const hotelid = req.session.hotelID
    const { id } = req.params
    const { approvalcode, subtotal2, totalamount2, paidtodate2, balance2 } = req.body



    //- update fds transactions
    const q1result = await pool.query(`
        UPDATE transactions
        SET paid = $1,
            approvalcode = $2
        WHERE hotelid = $3 AND
            accountid = $4
    `, [true, approvalcode, hotelid, id])

    //- update ancillary transactions
    const q2result = await pool.query(`
        UPDATE ancillary_transactions
        SET paid = $1,
            approvalcode = $2
        WHERE hotelid = $3 AND
            accountid = $4
    `, [true, approvalcode, hotelid, id])

    //- update housekeeping transactions
    const q3result = await pool.query(`
        UPDATE housekeeping_transactions
        SET paid = $1,
            approvalcode = $2
        WHERE hotelid = $3 AND
            accountid = $4
    `, [true, approvalcode, hotelid, id])



    //- update folio's "settled column"
    const q4result = await pool.query(`
        UPDATE folios
        SET settled = $1,
            subtotal = $2,
            totalamount = $3,
            paid = $4,
            balance = $5
        WHERE hotelid = $6 AND
            accountid = $7
    `, [true, subtotal2, totalamount2, totalamount2, 0, hotelid, id])

    //- update ga "settled column"
    const q5result = await pool.query(`
        UPDATE guestaccounts
        SET settled = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `, [true,hotelid, id])



    //- room status 'Inspected' to 'Recently checked-out'
    const q6result = await pool.query(`
        UPDATE 
            rooms 
        SET 
            status = 'Recently checked-out' 
        FROM 
            guestaccounts
        WHERE 
            rooms.roomid = guestaccounts.roomid AND
            guestaccounts.hotelid = $1 AND 
            guestaccounts.accountid = $2
    `, [hotelid, id])



    res.redirect(`/ga/invoice/${id}`)
})


//- set paid to true for all transactions, update ga "settled" column
//- "/ga/cashpayment/:id"
router.post('/cashpayment/:id', isAuthenticated, async(req,res)=>{



    const hotelid = req.session.hotelID
    const { id } = req.params
    const { subtotal3, totalamount3, paidtodate3, balance3 } = req.body


    //- update fds transactions
    const q1result = await pool.query(`
        UPDATE transactions
        SET paid = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `, [true, hotelid, id])

    //- update ancillary transactions
    const q2result = await pool.query(`
        UPDATE ancillary_transactions
        SET paid = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `, [true, hotelid, id])

    //- update housekeeping transactions
    const q3result = await pool.query(`
        UPDATE housekeeping_transactions
        SET paid = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `, [true, hotelid, id])



    //- update folio's "settled column"
    const q4result = await pool.query(`
        UPDATE folios
        SET settled = $1,
            subtotal = $2,
            totalamount = $3,
            paid = $4,
            balance = $5
        WHERE hotelid = $6 AND
            accountid = $7
    `, [true, subtotal3, totalamount3, totalamount3, 0, hotelid, id])

    //- update ga "settled column"
    const q5result = await pool.query(`
        UPDATE guestaccounts
        SET settled = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `, [true,hotelid, id])



    //- room status 'Inspected' to 'Recently checked-out'
    const q6result = await pool.query(`
        UPDATE 
            rooms 
        SET 
            status = 'Recently checked-out' 
        FROM 
            guestaccounts
        WHERE 
            rooms.roomid = guestaccounts.roomid AND
            guestaccounts.hotelid = $1 AND 
            guestaccounts.accountid = $2
    `, [hotelid, id])



    res.redirect(`/ga/invoice/${id}`)
})


router.get('/invoice/:id', async(req, res)=>{

    const hotelid = req.session.hotelID
    const { id } = req.params


    //- select from "transactions" table (fds)
    const q1 = `
        SELECT * FROM transactions
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
        JOIN ancillary_transactions t3
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
        FROM housekeeping_transactions t1
        JOIN ref_items t2
            ON t1.ref_itemid = t2.ref_itemid
        WHERE t1.hotelid = $1 AND
            t1.accountid = $2
    `
    const q3result = await pool.query(q3, [hotelid, id])

    //- select from "ga" and "ga_gd" table (fds)
    const q4 = `
        SELECT *
        FROM guestaccounts t1
            JOIN guestaccounts_guestdetails t2
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
        JOIN guestaccounts t2
            ON t1.hotelid = t2.hotelid
        WHERE t2.hotelid = $1 AND
            t2.accountid = $2
    `
    const q5result = await pool.query(q5, [hotelid, id])

    //- select folio
    const q6 = `
        SELECT * 
        FROM folios
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




//- "/ga/info/:id"
router.get('/info/:id', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    const hotelid = req.session.hotelID
    const { id } = req.params

    const q4 = `
        SELECT 
            t4.status AS roomstatus,
            t6.status AS promostatus,
            t5.discount AS foliodiscount,
            t5.tax AS foliotax,
            * 
        FROM guestaccounts t1
        JOIN guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN room_type t3 
            ON t1.typeid = t3.typeid
        JOIN rooms t4 
            ON t1.roomid = t4.roomid 
        JOIN folios t5
            ON t1.accountid = t5.accountid
        LEFT JOIN promos t6
            ON t1.promoid = t6.id
        WHERE t1.accountid = $1 AND
            t1.hotelid = $2
    `
    const q4result = await pool.query(q4, [id, hotelid])

    q4result.rows.forEach((ga)=>{
        if(ga.checkindate){
            ga.checkindate = formatDateWithTime(ga.checkindate)
        }
        if(ga.checkoutdate){
            ga.checkoutdate = formatDateWithTime(ga.checkoutdate)
        }
    })

    //- select from "transactions" table (fds)
    const q1 = `
        SELECT * FROM transactions
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
        JOIN ancillary_transactions t3
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
        FROM housekeeping_transactions t1
        JOIN ref_items t2
            ON t1.ref_itemid = t2.ref_itemid
        WHERE t1.hotelid = $1 AND
            t1.accountid = $2
    `
    const q3result = await pool.query(q3, [hotelid, id])

    res.render('receptionist/guestaccounts/info', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        ga: q4result.rows[0],
        t1: q1result.rows,
        t2: q2result.rows,
        t3: q3result.rows,
    })
})






//- extend
router.post('/extend/:id', isAuthenticated, async(req, res)=>{
    const hotelID = req.session.hotelID
    const { id } = req.params

    const { roomid, folioid,
        price, daysno, cost } = req.body

    const description = 'Extension'
    const date = getCurrentDate()

    const q1 = `
        INSERT INTO transactions(hotelid, accountid, roomid, description, price, qty, amount, date, folioid)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    const q1result = await pool.query(q1, [hotelID, id, roomid, description, price, daysno, cost, date, folioid])

    res.redirect(`/ga/info/${id}`)
})




module.exports = router