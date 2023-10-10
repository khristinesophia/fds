const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))




// render HA dashboard
router.get('/hsadmin', isAuthenticated, getHotelColor, async(req,res)=>{

    res.render('dashboard/hsadmin',{
        hotelColor: req.hotelColor
    })
})

// render R dashboard
router.get('/receptionist', isAuthenticated, getHotelColor, async (req,res)=>{
    
    res.render('dashboard/receptionist',{
        hotelColor: req.hotelColor
    })
})




module.exports = router