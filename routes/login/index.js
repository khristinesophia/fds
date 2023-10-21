//- path import
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- packages
const bcrypt = require('bcrypt')




//- "/login" route
router.post('/', async(req, res)=>{
    // get username and password from the request body
    const { username, password } = req.body

    try {
        // 
        const sa_result = await pool.query('SELECT * FROM superadmin_login WHERE username = $1', [username])
        const sa_length = sa_result.rows.length

        // 
        const hsa_result = await pool.query('SELECT * FROM hoteladmin_login WHERE username = $1', [username])
        const hsa_length = hsa_result.rows.length

        //
        const r_result = await pool.query('SELECT * FROM user_login WHERE username = $1', [username])
        const r_length = r_result.rows.length

        // setting user type
        let userType;
        let user;

        // if user is sa
        if(sa_length > 0){
            userType = 'sa'
            user = sa_result.rows[0]
        }

        // if user is hsa
        if(hsa_length > 0){
            userType = 'hsa'
            user = hsa_result.rows[0]
        }

        // if user is r
        if(r_length > 0){
            userType = 'r'
            user = r_result.rows[0]
        }
        
        // Check if the username is not found in any of the tables
        if (sa_length === 0 && hsa_length === 0 && r_length === 0) {
            res.render('login/loginSA', {
                loginError: true,  // pass a flag to indicate an error
                userNotFound: true  // pass a flag to indicate username not found
            });
        }

        // handle sa login
        if(userType === 'sa'){
            // if password is correct
            if(await bcrypt.compare(password, user.hashpassword)){
                // set session
                req.session.userID = user.userid
                req.session.username = user.username

                // redirect to hotels page
                res.redirect('/hotels')
            } else{
                res.render('login/loginSA', {
                    loginError: true  // pass a flag to indicate an error
                })
            }
        }

        // handle hsa login
        if(userType === 'hsa'){
            // if password is correct
            if(await bcrypt.compare(password, user.hashpassword)){
                // set session
                req.session.userID = user.userid
                req.session.username = user.username
                req.session.hotelID = user.hotelid

                // redirect 
                if(user.firstlogin === false){
                    res.redirect('/setup')
                } else{
                    res.redirect('/dashboard/hsadmin')
                }
            } else{
                res.render('login/loginSA', {
                    loginError: true  // pass a flag to indicate an error
                })
            }
        }

        // handle r login
        if(userType === 'r'){
            // if password is correct
            if(await bcrypt.compare(password, user.hashpassword)){
                req.session.userID = user.userid
                req.session.username = user.username
                req.session.hotelID = user.hotelid
    
                // redirect 
                res.redirect('/dashboard/receptionist')
            } else {
                res.render('login/loginSA', {
                    loginError: true  // pass a flag to indicate an error
                })
            }
        }

    } catch (error) {
        res.send(error.message)
    }
})





module.exports = router