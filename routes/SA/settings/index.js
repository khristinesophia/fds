//- path import
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- middleware import
const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))




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




module.exports = router