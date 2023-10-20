//- path import
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- middleware import
const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))

//- packages
const randomString = require('random-string')




//- add hotel route
//- "/hotels"
router.post('/', isAuthenticated, async(req, res)=>{
    try {
        // get values from the request body
        const { hotelname, hotellocation, hotelcontact, hotelemail } = req.body

        // first generate of hotelid
        let hotelid = randomString();

        // retrieve record matching generated hotelid
        const result = await pool.query(`SELECT * FROM hotels WHERE hotelid = $1`, 
            [hotelid]
        )
        const resultLength = result.rows.length

        // if result length is greater than 0, generate new random string
        if(resultLength > 0){
            hotelid = randomString();
        } 

        // add hotel query
        const addHotelQuery = `
            INSERT INTO hotels(hotelid, hotelname, hotellocation, hotelcontact, hotelemail)
            VALUES($1, $2, $3, $4, $5)
        `

        // execute query
        const newHotel = await pool.query(addHotelQuery, [hotelid, hotelname, hotellocation, hotelcontact, hotelemail])

        // redirect
        res.redirect('/hotels')

    } catch (error) {
        console.error(error.message)
    }
})

// read all hotel
router.get('/', isAuthenticated, async(req, res)=>{
    try {
        const allHotels = await pool.query('SELECT * FROM hotels')

        // Convert binary data to base64 string
        allHotels.rows.forEach(row => {
            if (row.hotelimage) {
                row.hotelimage = 'data:' + row.imagetype + ';base64,' + row.hotelimage.toString('base64')
            }
        })

        res.render('SA/hotels/hotels', {
            allHotelsArray: allHotels.rows
        })

    } catch (error) {
        console.error(error.message)
    }
})

// edit one hotel
router.post('/edit/:id', async(req, res)=>{
    try {
        // get id from params
        const { id } = req.params

        // get values from the request body
        const { hotelname, hotellocation, hotelcontact, hotelemail } = req.body

        const editHotelQuery = `
            UPDATE hotels
            SET hotelname = $1, 
                hotellocation = $2, 
                hotelcontact = $3, 
                hotelemail = $4
            WHERE hotelid = $5
        `

        const editHotel = await pool.query(editHotelQuery, [hotelname, hotellocation, hotelcontact, hotelemail, id])
    
        res.redirect('/hotels')
    } catch (error) {
        
    }
})

// delete one hotel
router.post('/delete/:id', isAuthenticated, async(req,res)=>{
    try {
        const { id } = req.params
        const deleteHotel = await pool.query('DELETE FROM hotels WHERE hotelid = $1', [id])

        res.redirect('/hotels')
    } catch (error) {
        console.error(error.message)
    }
})




module.exports = router