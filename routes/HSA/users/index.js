//- import path
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- bcrypt package
const bcrypt = require('bcrypt');

//- middleware
const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getCurrentDate = require(path.join(__basedir, 'utils', 'getCurrentDate'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))
const getHotelLogo = require(path.join(__basedir, 'middleware', 'getHotelLogo'))




//- render "users" page
router.get('/', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const allHSAdmins = await pool.query('SELECT * FROM hoteladmin_login WHERE hotelid = $1', [hotelid])
        const allReceptionists = await pool.query('SELECT * FROM user_login WHERE hotelid = $1', [hotelid])

        res.render('HSA/users/users', {
            allHSAdminsArray: allHSAdmins.rows,
            allReceptionistsArray: allReceptionists.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage
        })

    } catch (error) {
        console.error(error.message)
    }
})


//- add receptionist
router.post('/', isAuthenticated, async(req, res)=>{
    try {
        const { fullname, username, password } = req.body
        const hotelid = req.session.hotelID

        const hashedPassword = bcrypt.hashSync(password, 10);
        const datecreated = getCurrentDate()

        const newReceptionist = await pool.query(`INSERT INTO user_login(fullname, username, hashpassword, hotelid, datecreated) VALUES($1, $2, $3, $4, $5) RETURNING *`,
            [fullname, username, hashedPassword, hotelid, datecreated]
        )

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})

//- update receptionist
router.post("/edit/receptionist/:id", isAuthenticated, async(req, res)=>{
    try {
        const { id } = req.params
        const { name, username } = req.body
        const editReceptionist = await pool.query(`UPDATE user_login
            SET fullname = $1, 
                username = $2
            WHERE userid = $3`,
            [name, username, id]
        )

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})

//- delete receptionist
router.post('/delete/:id', isAuthenticated,async(req,res)=>{
    try {
        const { id } = req.params
        const deleteReceptionist = await pool.query('DELETE FROM user_login WHERE userid = $1', [id])

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})

//- change password receptionist
router.post('/changePW/receptionist/:id', isAuthenticated, async(req, res)=>{
    const { id } = req.params
    const { oldPassword, newPassword, confirmPassword } = req.body

    // get old hashpassword
    const result = await pool.query('SELECT * FROM user_login WHERE userid = $1', [id])
    const hashedOldPassword = result.rows[0].hashpassword

    // compare old password with old hashpassword
    const isPasswordValid = await bcrypt.compare(oldPassword, hashedOldPassword);

    if (!isPasswordValid) {
        console.log('Wrong old password')
        // Send an error response with the message
        return res.status(400).json({ error: 'Wrong old password. Please try again.' });
      }

    // compare new and confirm password
    if (newPassword !== confirmPassword) {
        console.log('New password and confirm password do not match')
        // Send an error response with the message
        return res.status(400).json({ error: 'New password and confirm password do not match. Please try again.' });
    }

    // hash new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    await pool.query('UPDATE user_login SET hashpassword = $1 WHERE userid = $2', [hashedNewPassword, id])

    // Send a success response
    return res.status(200).json({ message: 'Password updated successfully.' });

})




//- update hsa
router.post("/edit/manager/:id", isAuthenticated, async(req, res)=>{
    try {
        const { id } = req.params
        const { username } = req.body
        const editHotelAdmin = await pool.query(`UPDATE hoteladmin_login
            SET username = $1
            WHERE userid = $2`,
            [username, id]
        )

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})

//- change password hsa
router.post('/changePW/manager/:id', isAuthenticated, async(req, res)=>{
    const { id } = req.params
    const { oldPassword, newPassword, confirmPassword } = req.body

    // get old hashpassword
    const result = await pool.query('SELECT * FROM hoteladmin_login WHERE userid = $1', [id])
    const hashedOldPassword = result.rows[0].hashpassword

    // compare old password with old hashpassword
    const isPasswordValid = await bcrypt.compare(oldPassword, hashedOldPassword);

    if (!isPasswordValid) {
        console.log('Wrong old password')
        // Send an error response with the message
        return res.status(400).json({ error: 'Wrong old password. Please try again.' });
   
      }

    // compare new and confirm password
    if (newPassword !== confirmPassword) {
        console.log('New password and confirm password do not match')
        // Send an error response with the message
        return res.status(400).json({ error: 'New password and confirm password do not match. Please try again.' });
    }

    // hash new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    await pool.query('UPDATE hoteladmin_login SET hashpassword = $1 WHERE userid = $2', [hashedNewPassword, id])

    // Send a success response
    return res.status(200).json({ message: 'Password updated successfully.' });
})




module.exports = router