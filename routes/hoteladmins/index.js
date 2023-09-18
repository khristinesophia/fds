const express = require('express')
const router = express.Router()
const pool = require('../../config/db-config')
const bcrypt = require('bcrypt');

const isAuthenticated = require('../../middleware/isAuthenticated')


// render add form
router.get('/addHA', async(req, res)=>{

    const allHotels = await pool.query('SELECT * FROM hotels')

    // res.json(allHotels.rows) array of all

    res.render('HAs/addHA', {
        allHotelsArray: allHotels.rows
    })
})
// add 
router.post('/', async(req, res)=>{
    try {
        const { username, password, hotelid } = req.body

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newHotelAdmin = await pool.query(`INSERT INTO hoteladmin_login(username, hashpassword, hotelid) VALUES($1, $2, $3) RETURNING *`,
            [username, hashedPassword, hotelid]
        )

        res.redirect('/hoteladmins')
    } catch (error) {
        console.error(error.message)
    }
})


// read all
router.get('/', async(req, res)=>{
    try {
        const allHotelAdmins = await pool.query('SELECT * FROM hoteladmin_login T1 INNER JOIN hotels T2 ON T1.hotelid = T2.hotelid')

        // res.json(allHotelAdmins.rows) array of all 
        res.render('HAs/hoteladmins', {
            allHotelAdminsArray: allHotelAdmins.rows
        })

    } catch (error) {
        console.error(error.message)
    }
})

module.exports = router