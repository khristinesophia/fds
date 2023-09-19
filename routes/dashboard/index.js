const express = require('express')
const router = express.Router()
const pool = require('../../config/db-config')

router.get('/hoteladmin', (req,res)=>{
    res.render('dashboard/HA')
})

module.exports = router