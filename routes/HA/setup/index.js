const express = require('express')
const router = express.Router()
const pool = require('../../../config/db-config')

const isAuthenticated = require('../../../middleware/isAuthenticated')

router.get('/', isAuthenticated, (req, res)=>{
    res.render('HA/setup/setup')
})

module.exports = router