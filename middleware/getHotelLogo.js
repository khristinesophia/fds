const pool = require('../config/db-config')

const getHotelLogo = async(req, res, next) => {
    if(req.session.hotelID){
        const hotelid = req.session.hotelID

        const q1result =  await pool.query(`
            SELECT * FROM hotels
            WHERE hotelid = $1
        `, [hotelid])

        const hotel = q1result.rows[0]

        if(hotel.hotelimage){
            hotel.hotelimage = 'data:' + hotel.imagetype + ';base64,' + hotel.hotelimage.toString('base64')
        }

        req.hotelImage = hotel.hotelimage
        next()
    } 
}

module.exports = getHotelLogo
