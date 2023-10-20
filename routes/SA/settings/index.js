//- path import
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- middleware import
const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))

//- packages
const bcrypt = require('bcrypt')




router.get('/', isAuthenticated, async(req, res)=>{
    const userid = req.session.userID 

    const getUserQuery = `
        SELECT * FROM superadmin_login
        WHERE userid = $1
    `

    const getUser = await pool.query(getUserQuery, [userid])

    res.render('SA/settings/settings', {
        u: getUser.rows[0]
    })
})

router.post('/edit', isAuthenticated, async(req,res)=>{
    const userid = req.session.userID 
    const {fullname, username} = req.body

    const editUserQuery = `
        UPDATE superadmin_login
        SET fullname = $1,
            username = $2
        WHERE userid = $3
    `

    const editUser = await pool.query(editUserQuery, [fullname, username, userid])

    res.redirect('/settings')
})

router.post('/changepw', isAuthenticated, async(req,res)=>{
    const userid = req.session.userID 
    const { oldPassword, newPassword, confirmPassword } = req.body

    // get old hashpassword from the database
    const result = await pool.query('SELECT * FROM superadmin_login WHERE userid = $1', [userid])
    const hashedOldPassword = result.rows[0].hashpassword

    // compare old password with old hashpassword
    const isPasswordValid = await bcrypt.compare(oldPassword, hashedOldPassword);

    if (!isPasswordValid) {
        console.log('Wrong old password');
        // Send an error response with the message
        return res.status(400).json({ error: 'Wrong old password. Please try again.' });
    }

     // Compare new and confirm password
     if (newPassword !== confirmPassword) {
        console.log('New password and confirm password do not match');
        // Send an error response with the message
        return res.status(400).json({ error: 'New password and confirm password do not match. Please try again.' });
    }

    // Hash new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    // Update the password in the database only if the old password is correct
    await pool.query('UPDATE superadmin_login SET hashpassword = $1 WHERE userid = $2', [hashedNewPassword, userid]);

    // Send a success response

    res.redirect('/settings')
})




module.exports = router