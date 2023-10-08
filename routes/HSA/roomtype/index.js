const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const fs = require('fs')
const multer = require('multer')

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))

const upload = multer({ dest: 'uploads/' })

//display all roomtype
router.get('/', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
        const allRoomtype = await pool.query('SELECT * FROM room_type WHERE hotelid = $1' , [hotelid])

        // Convert binary data to base64 string
        allRoomtype.rows.forEach(row => {
            if (row.roomimage) {
                row.roomimage = 'data:' + row.imagetype + ';base64,' + row.roomimage.toString('base64');
            }
        });

        res.render('HSA/roomtype/allRoomtype', {
            allRoomtypeArray: allRoomtype.rows,
            hotelColor: req.hotelColor
        })

    } catch (error) {
        console.error(error.message)
    }
})

//view add roomtype form
router.get('/addRoomtype', isAuthenticated, getHotelColor, async(req, res) => {
    try {
        res.render('HSA/roomtype/addRoomtype', {
            hotelColor: req.hotelColor  
        });
    } catch (error) {
        console.error(error.message);
    }
});


//add roomtype
router.post('/addRoomtype', isAuthenticated, upload.single('roomimage'), async(req, res)=>{
    try {
        const hotelid = req.session.hotelID

        const { roomtype, description, price, capacity } = req.body;
    
        const roomimage = fs.readFileSync(req.file.path);

        // Insert the room type into the database
        const insertQuery = 'INSERT INTO room_type (hotelid, roomtype, description, price, capacity, roomimage) VALUES ($1, $2, $3, $4, $5, $6)';
        await pool.query(insertQuery, [hotelid, roomtype, description, price, capacity, roomimage]);

        console.log('Room Type Successfully Added!');
        res.redirect('/roomtype'); // Redirect to the room type listing page

    } catch (error) {
        console.error(error.message)
    }
})

// view edit form
router.get('/edit/:id', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const { id } = req.params
        const hotelid = req.session.hotelID

        const roomtype = await pool.query('SELECT * FROM room_type WHERE typeid = $1 and hotelid = $2', [id, hotelid])

        res.render('HSA/roomtype/editRoomtype', {
            r: roomtype.rows[0],
            hotelColor: req.hotelColor
        })
    } catch (error) {
        console.error(error.message)
    }
})

// edit room type
router.post('/edit/:id', isAuthenticated, upload.single('roomimage'), async(req, res)=>{
    try {
        const { id } = req.params
        const { roomtype, description, price, capacity } = req.body;
        const hotelid = req.session.hotelID
        if (req.file) {
            const roomimage = fs.readFileSync(req.file.path);

            await pool.query(
            'UPDATE room_type SET roomtype = $1, description = $2, price = $3, capacity = $4, roomimage = $5 WHERE typeid = $6 AND hotelid = $7',
            [roomtype, description, price, capacity, roomimage, id, hotelid]
            );

            console.log('Room Type Successfully Updated!');
            res.redirect('/roomtype');
        } else {
            console.log('No file uploaded');
        }
    } catch (error) {
        console.error(error.message)
    }
})


//delete roomtype
router.post('/delete/:id', isAuthenticated, async(req,res)=>{
    try {
        const { id } = req.params
        const hotelid = req.session.hotelID

        const deleteRoomtype = await pool.query('DELETE FROM room_type WHERE typeid = $1 AND hotelid = $2', [id, hotelid])
        console.log(`Room Type Successfully Deleted!`);
        res.redirect('/roomtype')
    } catch (error) {
        console.error(error.message)
    }
})


module.exports = router