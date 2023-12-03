const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const bcrypt = require('bcrypt');

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getCurrentDate = require(path.join(__basedir, 'utils', 'getCurrentDate'))




// add hsadmin
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { username, email, password, hotelid } = req.body;

        // Check password length
        if (password.length < 8) {
            return res.status(400).send('Password must be at least 8 characters');
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const datecreated = getCurrentDate();

        const newHotelAdmin = await pool.query(
            `INSERT INTO hoteladmin_login(username, email, hashpassword, hotelid, datecreated) VALUES($1, $2, $3, $4, $5) RETURNING *`,
            [username, email, hashedPassword, hotelid, datecreated]
        );

        res.redirect('/hsadmins');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
});


// read all hsadmins
router.get('/', isAuthenticated, async(req, res)=>{
    try {
        const allHotelAdmins = await pool.query('SELECT * FROM hoteladmin_login T1 INNER JOIN hotels T2 ON T1.hotelid = T2.hotelid')
        const allHotels = await pool.query('SELECT * FROM hotels')

        res.render('SA/HSAs/hsadmins', {
            allHotelAdminsArray: allHotelAdmins.rows,
            allHotelsArray: allHotels.rows
        })

    } catch (error) {
        console.error(error.message)
    }
})

module.exports = router