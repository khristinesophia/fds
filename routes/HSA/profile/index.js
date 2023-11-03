//- path import
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- middleware
const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))

//- fs and multer import
//- for uploading image
const fs = require('fs')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })




//- read hotel profile
//- "/profile"
router.get('/', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const hotel = await pool.query('SELECT * FROM hotels WHERE hotelid = $1', [hotelid])
        const colors = await pool.query('SELECT * FROM colorstack')

        // Convert binary data to base64 string
        hotel.rows.forEach(row => {
            if (row.hotelimage) {
                row.hotelimage = 'data:' + row.imagetype + ';base64,' + row.hotelimage.toString('base64')
            }
        })

        res.render('HSA/profile/profile', {
            h: hotel.rows[0],
            hotelColor: req.hotelColor,
            colorStacksArray: colors.rows
        })

    } catch (error) {
        console.error(error.message)
    }
})

//- edit hotel profile
//- "/profile/edit/:id"
router.post('/edit/:id', isAuthenticated, upload.single('hotelimage'), async(req, res)=>{
    try {
        const { id } = req.params
        const { hotelname, hotellocation, hotelcontact, hotelemail, hotelcolor } = req.body

        if(req.file){
            const hotelimage = fs.readFileSync(req.file.path)

            await pool.query(`
                UPDATE hotels
                SET hotelname = $1, 
                    hotellocation = $2, 
                    hotelcontact = $3, 
                    hotelemail = $4,
                    hotelimage = $5,
                    hotelcolor = $6
                WHERE hotelid = $7
            `, [hotelname, hotellocation, hotelcontact, hotelemail, hotelimage, hotelcolor, id])
        } else{

            await pool.query(`
                UPDATE hotels 
                SET hotelname = $1,
                    hotellocation = $2, 
                    hotelcontact = $3, 
                    hotelemail = $4, 
                    hotelcolor = $5
                WHERE hotelid = $6
            `, [hotelname, hotellocation, hotelcontact, hotelemail, hotelcolor, id])
        }

        res.redirect('/profile')
    } catch (error) {
        console.error(error.message)
    }
})




module.exports = router