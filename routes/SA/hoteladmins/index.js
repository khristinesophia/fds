const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const bcrypt = require('bcrypt');

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getCurrentDate = require(path.join(__basedir, 'utils', 'getCurrentDate'))




// add 
router.post('/', isAuthenticated, async(req, res)=>{
    try {
        const { username, password, hotelid } = req.body

        const hashedPassword = bcrypt.hashSync(password, 10);

        const datecreated = getCurrentDate()

        const newHotelAdmin = await pool.query(`INSERT INTO hoteladmin_login(username, hashpassword, hotelid, datecreated) VALUES($1, $2, $3, $4) RETURNING *`,
            [username, hashedPassword, hotelid, datecreated]
        )

        res.redirect('/hoteladmins')
    } catch (error) {
        console.error(error.message)
    }
})

// read all
router.get('/', isAuthenticated, async(req, res)=>{
    try {
        const allHotelAdmins = await pool.query('SELECT * FROM hoteladmin_login T1 INNER JOIN hotels T2 ON T1.hotelid = T2.hotelid')
        const allHotels = await pool.query('SELECT * FROM hotels')

        res.render('SA/HAs/hoteladmins', {
            allHotelAdminsArray: allHotelAdmins.rows,
            allHotelsArray: allHotels.rows
        })

    } catch (error) {
        console.error(error.message)
    }
})

module.exports = router