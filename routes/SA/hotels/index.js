const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const randomString = require('random-string')




// add
router.post('/', isAuthenticated, async(req, res)=>{
    try {

        const { hotelname } = req.body
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

        const newHotel = await pool.query(`INSERT INTO hotels(hotelid, hotelname) VALUES($1, $2) RETURNING *`,
            [hotelid, hotelname]
        )

        // **add successfully added here

        // redirect
        res.redirect('/hotels')

    } catch (error) {
        console.error(error.message)
    }
})

// read all
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

// delete one
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