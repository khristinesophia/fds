const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))




// render HA dashboard
router.get('/hoteladmin', isAuthenticated, getHotelColor, async(req,res)=>{

    res.render('dashboard/HA',{
        hotelColor: req.hotelColor
    })
})

// render R dashboard
router.get('/receptionist', isAuthenticated, (req,res)=>{
    res.render('dashboard/receptionist')
})




module.exports = router