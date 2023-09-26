const pool = require('../config/db-config')

const getHotelColor = async(req, res, next) => {
    if(req.session.hotelID){
        const hotelid = req.session.hotelID

        const hotelColor =  await pool.query(`SELECT t2.color, t2.background, t2.accent, t2.secondary, t2.main 
        FROM hotels t1 INNER JOIN colorstack t2 
        ON t1.hotelcolor = t2.color
        WHERE t1.hotelid = $1`, [hotelid])

        req.hotelColor = hotelColor.rows[0]
        next()
    } 
}

module.exports = getHotelColor
