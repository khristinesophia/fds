const express = require('express')
const router = express.Router()
const pool = require('../../../config/db-config')

const isAuthenticated = require('../../../middleware/isAuthenticated')


module.exports = router