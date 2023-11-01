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
        INSERT INTO guestaccounts(hotelid, typeid, roomid, adultno, childno, checkindate, checkoutdate, numofdays, modeofpayment, promocode, settled)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    `
    const q1result = await pool.query(q1, [hotelid, roomtype, roomid, adultno, childno, checkindate, checkoutdate, numofdays, modeofpayment, promocode, false])

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
        INSERT INTO transactions(hotelid, accountid, roomid, description, price, qty, amount, date, approvalcode, paid)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `
    const q3result = await pool.query(q3, [hotelid, accountid, roomid, description, price, qty, amount, date, approvalcode, true])

    //- update room status to 'Occupied'
    const q4 = `
        UPDATE rooms
            SET status = $1
        WHERE roomid = $2 AND 
            hotelid = $3
    `
    const q4result = await pool.query(q4, ['Occupied', roomid, hotelid])

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

    res.render('receptionist/guestaccounts/list', {
        hotelColor: req.hotelColor,
        guestaccounts: q1result.rows
    })
})


//- render "check-out" page
//- "/ga/checkout/:id"
router.get('/checkout/:id', isAuthenticated, getHotelColor, async(req,res)=>{

    const hotelid = req.session.hotelID
    const { id } = req.params

    //- select ga room num and status
    const q1 = `
        SELECT 
            t1.accountid,
            t2.fullname,
            t3.roomnum,
            t3.status,
            t1.settled
        FROM guestaccounts t1
        JOIN guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN rooms t3
            ON t1.roomid = t3.roomid
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
router.get('/folio/:id', isAuthenticated, getHotelColor, async(req, res)=>{

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


    res.render('receptionist/guestaccounts/folio', {
        hotelColor: req.hotelColor,
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
    const { approvalcode } = req.body

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

    //- update ga "settled column"
    const q3 = `
        UPDATE guestaccounts
        SET settled = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `
    const q3result = await pool.query(q3, [true, hotelid, id])

    res.redirect(`/ga/checkout/${id}`)
})

//- update ga "settled column"
//- "/ga/cashpayment/:id"
router.post('/cashpayment/:id', isAuthenticated, async(req,res)=>{

    const hotelid = req.session.hotelID
    const { id } = req.params

    //- update ga "settled column"
    const q1 = `
        UPDATE guestaccounts
        SET settled = $1
        WHERE hotelid = $2 AND
            accountid = $3
    `
    const q1result = await pool.query(q1, [true, hotelid, id])

    res.redirect(`/ga/checkout/${id}`)
})


//- render "detail" page
//- "/ga/detail/:id"
router.get('/detail/:id', isAuthenticated, getHotelColor, async(req, res)=>{
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
        WHERE t1.hotelid = $1 AND
            t1.accountid = $2
    `
    const q1result = await pool.query(q1, [hotelID, id])

    //- destructure
    const { accountid, hotelid, typeid, roomid, adultno, childno, 
        reservationdate, checkindate, checkoutdate, numofdays, 
        modeofpayment, promocode, settled, 
        fullname, email, contactno, address } = q1result.rows[0]

    //- insert into hist_guestaccounts
    const q2 = `
        INSERT INTO hist_guestaccounts(accountid, hotelid, typeid, roomid, adultno, childno, 
            reservationdate, checkindate, checkoutdate, numofdays, 
            modeofpayment, promocode, settled)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `
    const q2result = await pool.query(q2, [accountid, hotelid, typeid, roomid, adultno, childno, 
        reservationdate, checkindate, checkoutdate, numofdays, 
        modeofpayment, promocode, settled])

    //- insert into hist_guestaccounts_guestdetails
    const q3 = `
        INSERT INTO hist_guestaccounts_guestdetails(accountid, hotelid, fullname, email, contactno, address)
        VALUES($1, $2, $3, $4, $5, $6)
    `
    const q3result = await pool.query(q3, [accountid, hotelid, fullname, email, contactno, address])
    





    //- get t record (fds)
    const q4 = `
        SELECT * 
        FROM transactions
        WHERE accountid = $1 AND
            hotelid = $2
    `
    const q4result = await pool.query(q4, [id, hotelID])
    const t_fds = q4result.rows

    //- insert into hist_transactions
    t_fds.forEach(async (t) => {
        await pool.query(`INSERT INTO hist_transactions(transactionid, hotelid, accountid, roomid, 
                        description, price, qty, amount, date, 
                        approvalcode, paid)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [t.transactionid, t.hotelid, t.accountid, t.roomid, 
                t.description, t.price, t.qty, t.amount, t.date, 
                t.approvalcode, t.paid]
        )
    })



    //- get t record (anc)
    const q5 = `
        SELECT * 
        FROM ancillary_transactions
        WHERE accountid = $1 AND
            hotelid = $2
    `
    const q5result = await pool.query(q5, [id, hotelID])
    const t_anc = q5result.rows

    //- insert into hist_ancillary_transactions
    t_anc.forEach(async (t) => {
        await pool.query(`INSERT INTO hist_ancillary_transactions(transaction_id, transaction_date, ps_id, 
                        quantity, amount, employeeid, archived_date, 
                        accountid, hotelid, approvalcode, paid)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [t.transaction_id, t.transaction_date, t.ps_id, 
            t.quantity, t.amount, t.employeeid, t.archived_date, 
            t.accountid, t.hotelid, t.approvalcode, t.paid])
    })
    


    //- get t record (hsk)
    const q6 = `
        SELECT * 
        FROM housekeeping_transactions
        WHERE accountid = $1 AND
            hotelid = $2
    `
    const q6result = await pool.query(q6, [id, hotelID])
    const t_hsk = q6result.rows
    
    //- insert into hist_housekeeping_transactions
    t_hsk.forEach(async (t) => {
        await pool.query(`INSERT INTO hist_housekeeping_transactions(transactionid, reservationid, description, roomid,
                        transaction_type, ref_itemid, transactiondate, employeeid, remarks, 
                        price, qty, archiveddate, 
                        accountid, hotelid, amount, paid, approvalcode)
                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `, [t.transactionid, t.reservationid, t.description, t.roomid,
                t.transaction_type, t.ref_itemid, t.transactiondate, t.employeeid, t.remarks, 
                t.price, t.qty, t.archiveddate, 
                t.accountid, t.hotelid, t.amount, t.paid, t.approvalcode])
    })

    //- delete ga
    const q7 = `
        DELETE FROM guestaccounts
        WHERE hotelid = $1 AND
            accountid = $2
    `
    const q7result = await pool.query(q7, [hotelID, id])

    res.redirect('/archivedga')
})




module.exports = router