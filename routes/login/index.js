const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const bcrypt = require('bcrypt')




// render login form
router.get('/:userCode', (req, res)=>{
    const { userCode } = req.params

    if(userCode == 'SA'){
        res.render('login/loginSA')
    }
    if(userCode == 'HSA'){
        res.render('login/loginHSA')
    }
    if(userCode == 'R'){
        res.render('login/loginR')
    }
    
})


// SA login
router.post('/superadmin', async (req, res) => {
    const { username, password } = req.body
    try {
        // get user from DB
        const result = await pool.query('SELECT * FROM superadmin_login WHERE username = $1', [username])
        const user = result.rows[0]

        // if user exists and password is correct
        if (user && await bcrypt.compare(password, user.hashpassword)) {
            req.session.userID = user.userid
            req.session.username = user.username

            // redirect to hotels page
            res.redirect('/hotels')
        } else {
            // Display the error message box
            res.render('login/loginSA', {
                loginError: true  // Pass a flag to indicate an error
            })
        }
    } catch (error) {
        res.send(error.message)
    }
})


// HSA login
router.post('/hsadmin', async (req, res)=>{
    const { username, password } = req.body
    try {
        // get user from DB
        const result = await pool.query('SELECT * FROM hoteladmin_login WHERE username = $1', [username])
        const user = result.rows[0]

        // if user exists and password is correct
        if(user && await bcrypt.compare(password, user.hashpassword)){
            req.session.userID = user.userid
            req.session.username = user.username
            req.session.hotelID = user.hotelid

            // redirect 
            if(user.firstlogin === false){
                res.redirect('/setup')
            } else{
                res.redirect('/dashboard/hsadmin')
            }
        } else {
            // Display the error message box
            res.render('login/loginHSA', {
                loginError: true  // Pass a flag to indicate an error
            })
        }

    } catch (error) {
        res.send(error.message)
    }
})


// R login
router.post('/receptionist', async (req, res)=>{
    const { username, password } = req.body
    try {
        // get user from DB
        const result = await pool.query('SELECT * FROM user_login WHERE username = $1', [username])
        const user = result.rows[0]

        // if user exists and password is correct
        if(user && await bcrypt.compare(password, user.hashpassword)){
            req.session.userID = user.userid
            req.session.username = user.username
            req.session.hotelID = user.hotelid

            // redirect 
            res.redirect('/dashboard/receptionist')
        } else {
            // Display the error message box
            res.render('login/loginR', {
                loginError: true  // Pass a flag to indicate an error
            })
        }
    } catch (error) {
        res.send(error.message)
    }
})




module.exports = router