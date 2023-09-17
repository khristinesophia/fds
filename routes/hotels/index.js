const express = require('express')
const router = express.Router()
const pool = require('../../config/db-config')

const isAuthenticated = require('../../middleware/isAuthenticated')


// render add form
router.get('/addhotel', isAuthenticated, (req, res)=>{
    res.render('hotels/addhotel')
})
// add
router.post('/', isAuthenticated, async(req, res)=>{
    try {

        const { hotelname } = req.body
        const newHotel = await pool.query(`INSERT INTO hotel(hotelname) VALUES($1) RETURNING *`,
            [hotelname]
        )
        // res.json(newHotel)

        // **add successfully added here

        res.redirect('/hotels')

    } catch (error) {
        console.error(error.message)
    }
})


// read 
router.get('/', isAuthenticated, async(req, res)=>{
    try {
        const allHotels = await pool.query('SELECT * FROM hotel')

        // res.json(allHotels.rows) array of all

        res.render('hotels/hotels', {
            allHotelsArray: allHotels.rows
        })

    } catch (error) {
        console.error(error.message)
    }
})

// read one
router.get('/:id', isAuthenticated, async(req, res)=>{
    try {
        const { id } = req.params
        const hotel = await pool.query('SELECT * FROM hotel WHERE hotelid = $1', [id])

        // res.json(hotel.rows[0]) object of one

        res.render('hotels/hotel', {
            h: hotel.rows[0]
        })
        
    } catch (error) {
        console.error(error.message)
    }
})


// render edit form
router.get("/edithotel/:id", isAuthenticated, async(req, res)=>{
    try {
        const { id } = req.params
        const hotel = await pool.query('SELECT * FROM hotel WHERE hotelid = $1', [id])

        res.render('hotels/edithotel', {
            h: hotel.rows[0]
        })
        
    } catch (error) {
        console.error(error.message)
    }
})
// edit one
router.post("/edit/:id", isAuthenticated, async(req, res)=>{
    try {
        const { id } = req.params
        const { hotelname, hotellocation, hotelcontact, hotelemail } = req.body
        const editHotel = await pool.query(`UPDATE hotel 
            SET hotelname = $1, hotellocation = $2, hotelcontact = $3, hotelemail = $4
            WHERE hotelid = $5`,
            [hotelname, hotellocation, hotelcontact, hotelemail, id]
        )

        res.redirect('/hotels')
    } catch (error) {
        console.error(error.message)
    }
})




// delete one
router.post('/delete/:id', isAuthenticated, async(req,res)=>{
    try {
        const { id } = req.params
        const deleteHotel = await pool.query('DELETE FROM hotel WHERE hotelid = $1', [id])

        res.redirect('/hotels')
    } catch (error) {
        console.error(error.message)
    }
})


module.exports = router