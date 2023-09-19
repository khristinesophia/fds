const express = require('express')
const router = express.Router()
const pool = require('../../config/db-config')

const isAuthenticated = require('../../middleware/isAuthenticated')

router.get('/hoteladmin', isAuthenticated, (req,res)=>{
    res.render('dashboard/HA')
})

module.exports = router