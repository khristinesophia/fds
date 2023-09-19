const express = require('express')
const router = express.Router()
const pool = require('../../config/db-config')

const bcrypt = require('bcrypt');


// render form
router.get('/SAform', (req, res)=>{
    res.render('login/SAlogin')
})

// login
router.post('/superadmin', async (req, res)=>{
    const { username, password } = req.body

    try {
        // get user from DB
        const result = await pool.query('SELECT * FROM superadmin_login WHERE username = $1', [username])
        const user = result.rows[0]

        // if user exists and password is correct
        if(user && await bcrypt.compare(password, user.hashpassword)){
            req.session.userID = user.superadminid
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

router.get('/HAform', (req, res)=>{
    res.render('login/HAlogin')
})

// login
router.post('/hoteladmin', async (req, res)=>{
    const { username, password } = req.body

    try {
        // get user from DB
        const result = await pool.query('SELECT * FROM hoteladmin_login WHERE username = $1', [username])
        const user = result.rows[0]

        // if user exists and password is correct
        if(user && await bcrypt.compare(password, user.hashpassword)){
            req.session.userID = user.adminid
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


module.exports = router