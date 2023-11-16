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


//- render "add promo" page
//- "/pd/add"
router.get('/add', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    const hotelID = req.session.hotelID

    const q1 = `
        SELECT * FROM room_type
        WHERE hotelid = $1
        ORDER BY price ASC
    `
    const q1result = await pool.query(q1, [hotelID])

    res.render('HSA/pd/add', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        allRoomTypeArray: q1result.rows
    })
})

//- create promo
//- "/pd/create"
router.post('/create', isAuthenticated, getHotelColor, upload.single('poster'), async(req, res)=>{
    const hotelID = req.session.hotelID
    const userID = req.session.userID

    const { code, name, description, discount, startdate, enddate,
        typeid } = req.body
    
    const poster = fs.readFileSync(req.file.path)
    
    let { isavailable_mon, isavailable_tues, isavailable_wed, isavailable_thurs,
        isavailable_fri, isavailable_sat, isavailable_sun } = req.body
    
    const dateadded = getCurrentDate()

    //- mon
    if(isavailable_mon === 'on'){
        isavailable_mon = true
    } else{
        isavailable_mon = false
    }
    //- tues
    if(isavailable_tues === 'on'){
        isavailable_tues = true
    } else{
        isavailable_tues = false
    }
    //- wed
    if(isavailable_wed === 'on'){
        isavailable_wed = true
    } else{
        isavailable_wed = false
    }
    //- thurs
    if(isavailable_thurs === 'on'){
        isavailable_thurs = true
    } else{
        isavailable_thurs = false
    }
    //- fri
    if(isavailable_fri === 'on'){
        isavailable_fri = true
    } else{
        isavailable_fri = false
    }
    //- sat
    if(isavailable_sat === 'on'){
        isavailable_sat = true
    } else{
        isavailable_sat = false
    }
    //- sun
    if(isavailable_sun === 'on'){
        isavailable_sun = true
    } else{
        isavailable_sun = false
    }

    const q1 = `
        INSERT INTO promos(hotelid, code, name, description, poster, discount, startdate, enddate,
            isavailable_mon, isavailable_tues, isavailable_wed, isavailable_thurs,
            isavailable_fri, isavailable_sat, isavailable_sun,
            typeid, userid, dateadded)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `
    const q1result = await pool.query(q1, [hotelID, code, name, description, poster, discount, startdate, enddate,
        isavailable_mon, isavailable_tues, isavailable_wed, isavailable_thurs,
        isavailable_fri, isavailable_sat, isavailable_sun,
        typeid, userID, dateadded])

    res.redirect('/pd')
})

//- render "active promo list" page
//- "/pd"
router.get('/', isAuthenticated, getHotelColor, getHotelLogo, async(req,res)=>{
    const hotelID = req.session.hotelID

    const q1 = `
        SELECT * FROM promos
        WHERE hotelid = $1
        AND status = $2 
        ORDER BY dateadded ASC
    `
    const q1result = await pool.query(q1, [hotelID, 'Active'])

    q1result.rows.forEach(row => {
        if (row.poster) {
            row.poster = 'data:' + row.imagetype + ';base64,' + row.poster.toString('base64')
        }
    })

    q1result.rows.forEach((row)=>{
        if(row.startdate){
            row.startdate = formatDate(row.startdate)
        }
        if(row.enddate){
            row.enddate = formatDate(row.enddate)
        }
    })

    res.render('HSA/pd/list', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        allPromosArray: q1result.rows
    })
})

//- render "inactive promo list" page
//- "/pd"
router.get('/inactive', isAuthenticated, getHotelColor, getHotelLogo, async(req,res)=>{
    const hotelID = req.session.hotelID

    const q1 = `
        SELECT * FROM promos
        WHERE hotelid = $1
        AND status = $2 
        ORDER BY dateadded ASC
    `
    const q1result = await pool.query(q1, [hotelID, 'Inactive'])

    q1result.rows.forEach(row => {
        if (row.poster) {
            row.poster = 'data:' + row.imagetype + ';base64,' + row.poster.toString('base64')
        }
    })

    q1result.rows.forEach((row)=>{
        if(row.startdate){
            row.startdate = formatDate(row.startdate)
        }
        if(row.enddate){
            row.enddate = formatDate(row.enddate)
        }
    })

    res.render('HSA/pd/inactive', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        allPromosArray: q1result.rows
    })
})

//- render "edit promo" page
//- "/pd/edit/:id"
router.get('/edit/:id', isAuthenticated, getHotelColor, getHotelLogo, async(req,res)=>{
    const { id } = req.params
    const hotelID = req.session.hotelID

    const q1 = `
        SELECT * FROM room_type
        WHERE hotelid = $1
        ORDER BY price ASC
    `
    const q1result = await pool.query(q1, [hotelID])

    const q2 = `
        SELECT 
            t1.id, 
            t1.code,
            t1.name,
            t1.description,
            t1.poster,
            t1.discount,
            t1.startdate,
            t1.enddate,
            t1.isavailable_mon,
            t1.isavailable_tues,
            t1.isavailable_wed,
            t1.isavailable_thurs,
            t1.isavailable_fri,
            t1.isavailable_sat,
            t1.isavailable_sun,
            t1.status,
            t1.typeid,
            t2.roomtype
        FROM promos t1
        JOIN room_type t2
            ON t1.typeid = t2.typeid
        WHERE t1.id = $1 AND
            t1.hotelid = $2
    `
    const q2result = await pool.query(q2, [id, hotelID])

    q2result.rows.forEach((row)=>{
        if(row.startdate){
            row.startdate = formatDate(row.startdate)
        }
        if(row.enddate){
            row.enddate = formatDate(row.enddate)
        }
    })

    res.render('HSA/pd/edit', {
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage,
        allRoomTypeArray: q1result.rows,
        p: q2result.rows[0],
    })
})

//- update promo
//- "pd/update/:id"
router.post('/update/:id', isAuthenticated, upload.single('poster'), async(req,res)=>{
    try {
        const { id } = req.params
        const hotelID = req.session.hotelID

        const { code, name, discount, description, status, startdate, enddate,
            typeid } = req.body
        
        let { isavailable_mon, isavailable_tues, isavailable_wed, isavailable_thurs,
            isavailable_fri, isavailable_sat, isavailable_sun } = req.body
        
        //- mon
        if(isavailable_mon === 'on'){
            isavailable_mon = true
        } else{
            isavailable_mon = false
        }
        //- tues
        if(isavailable_tues === 'on'){
            isavailable_tues = true
        } else{
            isavailable_tues = false
        }
        //- wed
        if(isavailable_wed === 'on'){
            isavailable_wed = true
        } else{
            isavailable_wed = false
        }
        //- thurs
        if(isavailable_thurs === 'on'){
            isavailable_thurs = true
        } else{
            isavailable_thurs = false
        }
        //- fri
        if(isavailable_fri === 'on'){
            isavailable_fri = true
        } else{
            isavailable_fri = false
        }
        //- sat
        if(isavailable_sat === 'on'){
            isavailable_sat = true
        } else{
            isavailable_sat = false
        }
        //- sun
        if(isavailable_sun === 'on'){
            isavailable_sun = true
        } else{
            isavailable_sun = false
        }
        
        if (req.file){
            const poster = fs.readFileSync(req.file.path)

            await pool.query(`
                UPDATE promos
                SET code = $1, 
                    name = $2, 
                    discount = $3, 
                    description = $4, 
                    poster = $5, 
                    status = $6, 
                    startdate = $7, 
                    enddate = $8, 
                    isavailable_mon = $9, 
                    isavailable_tues = $10, 
                    isavailable_wed = $11, 
                    isavailable_thurs = $12, 
                    isavailable_fri = $13, 
                    isavailable_sat = $14, 
                    isavailable_sun = $15,
                    typeid = $16 
                WHERE id = $17 AND 
                    hotelid = $18
            `, [code, name, discount, description, poster, status, startdate, enddate,
                isavailable_mon, isavailable_tues, isavailable_wed, isavailable_thurs,
                isavailable_fri, isavailable_sat, isavailable_sun,
                typeid, id, hotelID])
        } else{
            await pool.query(`
                UPDATE promos
                SET code = $1, 
                    name = $2, 
                    discount = $3, 
                    description = $4,
                    status = $5, 
                    startdate = $6, 
                    enddate = $7, 
                    isavailable_mon = $8, 
                    isavailable_tues = $9, 
                    isavailable_wed = $10, 
                    isavailable_thurs = $11, 
                    isavailable_fri = $12, 
                    isavailable_sat = $13, 
                    isavailable_sun = $14,
                    typeid = $15 
                WHERE id = $16 AND 
                    hotelid = $17
            `, [code, name, discount, description, status, startdate, enddate,
                isavailable_mon, isavailable_tues, isavailable_wed, isavailable_thurs,
                isavailable_fri, isavailable_sat, isavailable_sun,
                typeid, id, hotelID])
        }
        res.redirect('/pd')

    } catch (error) {
        console.error(error.message)
    }
    
    
})

//- delete promo
//- "pd/delete/:id"
router.post('/delete/:id', isAuthenticated, async(req, res)=>{
    const { id } = req.params
    const hotelID = req.session.hotelID

    const q1 = `
        DELETE FROM promos
        WHERE id = $1 AND 
            hotelid = $2
    `

    const q1result = await pool.query(q1, [id, hotelID])

    res.redirect('/pd')
})




module.exports = router