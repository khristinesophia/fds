//- import path
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- middlewares
const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))
const getHotelLogo = require(path.join(__basedir, 'middleware', 'getHotelLogo'))




// render HA dashboard
router.get('/hsadmin', isAuthenticated, getHotelColor, getHotelLogo, async(req,res)=>{

    res.render('dashboard/hsadmin',{
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage
    })
})

// render R dashboard
router.get('/receptionist', isAuthenticated, getHotelColor, getHotelLogo, async (req,res)=>{
    
    res.render('dashboard/receptionist',{
        hotelColor: req.hotelColor,
        hotelLogo: req.hotelImage
    })
})




module.exports = router