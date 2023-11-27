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


//- render "check-out" page
//- "/ga/checkout/:id"
router.get('/checkout/:id', isAuthenticated, getHotelColor, getHotelLogo, async(req,res)=>{

    const hotelid = req.session.hotelID
    const { id } = req.params

    //- select ga room num and status
    const q1 = `
        SELECT 
            t1.accountid,
            t2.fullname,
            t4.roomnum,
            t4.status,
            t3.settled
        FROM guestaccounts t1
        JOIN guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN folios t3
            ON t1.accountid = t3.accountid
        JOIN rooms t4
            ON t1.roomid = t4.roomid
        WHERE t1.hotelid = $1 AND
            t1.accountid = $2
    `

    const q1result = await pool.query(q1, [hotelid, id])

    res.render('receptionist/guestaccounts/checkout', {
        hotelColor: req.hotelColor,
        ga: q1result.rows[0]
    })
})

//- room status 'Occupied' to 'To check out'
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

    res.redirect(`/ga/checkout/${q2result.rows[0].accountid}`)
})

//- room status 'Inspected' to 'Recently checked-out'
//- "/ga/rco/:id"
router.post('/rco/:id', isAuthenticated, async(req, res)=>{

    const hotelid = req.session.hotelID
    const { id } = req.params

    const q1 = `
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
    `
    const q1result = await pool.query(q1, [hotelid, id])

    const q2 = `
        SELECT *
        FROM guestaccounts
        WHERE hotelid = $1 AND
        accountid = $2
    `
    const q2result = await pool.query(q2, [hotelid, id])

    res.redirect(`/ga/checkout/${q2result.rows[0].accountid}`)
})

//- render "folio" page
//- "/ga/folio/:id"
router.get('/folio/:id', getHotelColor, getHotelLogo, async(req, res)=>{

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
            JOIN folios t3
                ON t1.accountid = t3.accountid
            JOIN rooms t4
                ON t1.roomid = t4.roomid
        WHERE t1.hotelid = $1 AND 
            t1.accountid = $2
    `
    const q4result = await pool.query(q4, [hotelid, id])


    res.render('receptionist/guestaccounts/folio', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage, 
        t1: q1result.rows,
        t2: q2result.rows,
        t3: q3result.rows,
        ga: q4result.rows[0]
    })

})

//- store approval code for credit/debit card payments
//- "/ga/cardpayment/:id"
router.post('/cardpayment/:id', isAuthenticated, async(req,res)=>{

    const hotelid = req.session.hotelID
    const { id } = req.params
    const { approvalcode, subtotal2, totalamount2, paidtodate2, balance2 } = req.body

    //- update ancillary transactions
    const q1 = `
        UPDATE ancillary_transactions
        SET paid = $1,
            approvalcode = $2
        WHERE hotelid = $3 AND
            accountid = $4
    `
    const q1result = await pool.query(q1, [true, approvalcode, hotelid, id])

    //- update housekeeping transactions
    const q2 = `
        UPDATE housekeeping_transactions
        SET paid = $1,
            approvalcode = $2
        WHERE hotelid = $3 AND
            accountid = $4
    `
    const q2result = await pool.query(q2, [true, approvalcode, hotelid, id])

    //- update folio's "settled column"
    const q3 = `
        UPDATE folios
        SET settled = $1,
            subtotal = $2,
            totalamount = $3,
            paid = $4,
            balance = $5
        WHERE hotelid = $6 AND
            accountid = $7
    `
    const q3result = await pool.query(q3, [true, subtotal2, totalamount2, totalamount2, 0, hotelid, id])

    //- update ga "settled column"
    const q4 = `
        UPDATE guestaccounts
        SET settled = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `
    const q4result = await pool.query(q4, [true,hotelid, id])

    res.redirect(`/ga/checkout/${id}`)
})

//- set paid to true for all transactions, update ga "settled" column
//- "/ga/cashpayment/:id"
router.post('/cashpayment/:id', isAuthenticated, async(req,res)=>{

    const hotelid = req.session.hotelID
    const { id } = req.params
    const { subtotal3, totalamount3, paidtodate3, balance3 } = req.body


    //- update ancillary transactions
    const q1 = `
        UPDATE ancillary_transactions
        SET paid = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `
    const q1result = await pool.query(q1, [true, hotelid, id])

    //- update housekeeping transactions
    const q2 = `
        UPDATE housekeeping_transactions
        SET paid = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `
    const q2result = await pool.query(q2, [true, hotelid, id])

    //- update folio's "settled column"
    const q3 = `
        UPDATE folios
        SET settled = $1,
            subtotal = $2,
            totalamount = $3,
            paid = $4,
            balance = $5
        WHERE hotelid = $6 AND
            accountid = $7
    `
    const q3result = await pool.query(q3, [true, subtotal3, totalamount3, totalamount3, 0, hotelid, id])

    //- update ga "settled column"
    const q4 = `
        UPDATE guestaccounts
        SET settled = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `
    const q4result = await pool.query(q4, [true,hotelid, id])

    res.redirect(`/ga/checkout/${id}`)
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


//- render "detail" page
//- "/ga/detail/:id"
router.get('/detail/:id', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
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
        LEFT JOIN promos t5
            ON t1.promoid = t5.id
        WHERE t1.accountid = $1 AND
            t1.hotelid = $2
    `
    const q1result = await pool.query(q1, [id, hotelid])

    q1result.rows.forEach((ga)=>{
        if(ga.checkindate){
            ga.checkindate = formatDateWithTime(ga.checkindate)
        }
        if(ga.checkoutdate){
            ga.checkoutdate = formatDateWithTime(ga.checkoutdate)
        }
    })

    res.render('receptionist/guestaccounts/detail', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        ga: q1result.rows[0]
    })
})




//- extend
router.post('/extend/:id', isAuthenticated, async(req, res)=>{
    const hotelID = req.session.hotelID
    const { id } = req.params

    const { roomid, folioid,
        rate_perhour, hoursno, cost } = req.body

    const description = 'Extension'
    const date = getCurrentDate()

    const q1 = `
        INSERT INTO transactions(hotelid, accountid, roomid, description, price, qty, amount, date, folioid)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    const q1result = await pool.query(q1, [hotelID, id, roomid, description, rate_perhour, hoursno, cost, date, folioid])

    res.redirect(`/ga/folio/${id}`)
})





//- archive ga
//- "ga/archive/:id"
router.post('/archive/:id', isAuthenticated, async(req, res)=>{
    const hotelID = req.session.hotelID
    const { id } = req.params

    //- get ga record
    const q1 = `
        SELECT * FROM guestaccounts t1
        JOIN guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN folios t3
            ON t1.accountid = t3.accountid
        JOIN room_type t4
            ON t1.typeid = t4.typeid
        JOIN rooms t5
            ON t1.roomid = t5.roomid
        WHERE t1.hotelid = $1 AND
            t1.accountid = $2
    `
    const q1result = await pool.query(q1, [hotelID, id])

    //- destructure
    const { accountid, hotelid, roomtype, roomnum, adultno, childno, 
        reservationdate, checkindate, checkoutdate, numofdays, 
        modeofpayment, promocode, 
        fullname, email, contactno, address,
        folioid, subtotal, discount, tax, totalamount, paid, balance, settled } = q1result.rows[0]

    //- insert into hist_guestaccounts
    const q2 = `
        INSERT INTO hist_guestaccounts(accountid, hotelid, roomtype, roomnum, adultno, childno, 
            reservationdate, checkindate, checkoutdate, numofdays, 
            modeofpayment, promocode, settled)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `
    const q2result = await pool.query(q2, [accountid, hotelid, roomtype, roomnum, adultno, childno, 
        reservationdate, checkindate, checkoutdate, numofdays, 
        modeofpayment, promocode, settled])

    //- insert into hist_guestaccounts_guestdetails
    const q3 = `
        INSERT INTO hist_guestaccounts_guestdetails(accountid, hotelid, fullname, email, contactno, address)
        VALUES($1, $2, $3, $4, $5, $6)
    `
    const q3result = await pool.query(q3, [accountid, hotelid, fullname, email, contactno, address])
    
    //- insert into hist_folio
    const q4 = `
        INSERT INTO hist_folios(folioid, accountid, hotelid, subtotal, discount, tax, totalamount, paid, balance, settled)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `
    const q4result = await pool.query(q4, [folioid, accountid, hotelid, subtotal, discount, tax, totalamount, paid, balance, settled])




    //- get t record (fds)
    const q5 = `
        SELECT * 
        FROM transactions t1
        JOIN rooms t2
            ON t1.roomid = t2.roomid
        WHERE t1.accountid = $1 AND
            t1.hotelid = $2
    `
    const q5result = await pool.query(q5, [id, hotelID])
    const t_fds = q5result.rows

    //- insert into hist_transactions
    t_fds.forEach(async (t) => {
        await pool.query(`INSERT INTO hist_transactions(transactionid, hotelid, accountid, roomnum, 
                        description, price, qty, amount, date, 
                        approvalcode, paid, folioid)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [t.transactionid, t.hotelid, t.accountid, t.roomnum, 
                t.description, t.price, t.qty, t.amount, t.date, 
                t.approvalcode, t.paid, t.folioid]
        )
    })



    //- get t record (anc)
    const q6 = `
        SELECT * 
        FROM ancillary_transactions
        WHERE accountid = $1 AND
            hotelid = $2
    `
    const q6result = await pool.query(q6, [id, hotelID])
    const t_anc = q6result.rows

    //- insert into hist_ancillary_transactions
    t_anc.forEach(async (t) => {
        await pool.query(`INSERT INTO hist_ancillary_transactions(transaction_id, transaction_date, ps_id, 
                        quantity, amount, employeeid, archived_date, 
                        accountid, hotelid, approvalcode, paid, folioid)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [t.transaction_id, t.transaction_date, t.ps_id, 
            t.quantity, t.amount, t.employeeid, t.archived_date, 
            t.accountid, t.hotelid, t.approvalcode, t.paid, t.folioid])
    })
    


    //- get t record (hsk)
    const q7 = `
        SELECT * 
        FROM housekeeping_transactions t1
        JOIN rooms t2
            ON t1.roomid = t2.roomid
        WHERE t1.accountid = $1 AND
            t1.hotelid = $2
    `
    const q7result = await pool.query(q7, [id, hotelID])
    const t_hsk = q7result.rows
    
    //- insert into hist_housekeeping_transactions
    t_hsk.forEach(async (t) => {
        await pool.query(`INSERT INTO hist_housekeeping_transactions(transactionid, reservationid, description, roomnum,
                        transaction_type, ref_itemid, transactiondate, employeeid, remarks, 
                        price, qty, archiveddate, 
                        accountid, hotelid, amount, paid, approvalcode, folioid)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            `, [t.transactionid, t.reservationid, t.description, t.roomnum,
                t.transaction_type, t.ref_itemid, t.transactiondate, t.employeeid, t.remarks, 
                t.price, t.qty, t.archiveddate, 
                t.accountid, t.hotelid, t.amount, t.paid, t.approvalcode, t.folioid])
    })

    //- delete ga
    const q8 = `
        DELETE FROM guestaccounts
        WHERE hotelid = $1 AND
            accountid = $2
    `
    const q8result = await pool.query(q8, [hotelID, id])

    res.redirect('/archivedga')
})




module.exports = router