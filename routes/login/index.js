const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const bcrypt = require('bcrypt');




// render login form
router.get('/:userCode', (req, res)=>{
    const { userCode } = req.params

    if(userCode == 'SA'){
        res.render('login/loginSA')
    }
    if(userCode == 'HA'){
        res.render('login/loginHA')
    }
    if(userCode == 'R'){
        res.render('login/loginR')
    }
    
})

// SA
router.post('/superadmin', async (req, res)=>{

    const { username, password } = req.body
    try {
        // get user from DB
        const result = await pool.query('SELECT * FROM superadmin_login WHERE username = $1', [username])
        const user = result.rows[0]

        // if user exists and password is correct
        if(user && await bcrypt.compare(password, user.hashpassword)){
            req.session.userID = user.userid
            req.session.username = user.username

            // redirect to hotels page
            res.redirect('/hotels')
        } else {
            // error handling for invalid credentials
            res.status(401).send('Invalid credentials.')
        }
    } catch (error) {
        res.send(error.message)
    }
})

// HA
router.post('/hoteladmin', async (req, res)=>{

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
                res.redirect('/dashboard/hoteladmin')
            }
        } else {
            // error handling for invalid credentials
            res.status(401).send('Invalid credentials.')
        }

    } catch (error) {
        res.send(error.message)
    }
})

// R
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
            // error handling for invalid credentials
            res.status(401).send('Invalid credentials.')
        }
    } catch (error) {
        res.send(error.message)
    }
})




module.exports = router