const express = require('express')
const router = express.Router()
const pool = require('../../config/db-config')

const randomString = require('random-string');

const isAuthenticated = require('../../middleware/isAuthenticated')


// render add form
router.get('/addhotel', isAuthenticated, (req, res)=>{
    res.render('hotels/addhotel')
})
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
        ) // res.json(newHotel)

        // **add successfully added here

        res.redirect('/hotels')
       
    } catch (error) {
        console.error(error.message)
    }
})


// read 
router.get('/', isAuthenticated, async(req, res)=>{
    try {
        const allHotels = await pool.query('SELECT * FROM hotels')

        // res.json(allHotels.rows) array of all

        res.render('hotels/hotels', {
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