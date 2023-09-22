const express = require('express')
const router = express.Router()
const pool = require('../../../config/db-config')
const bcrypt = require('bcrypt');

const isAuthenticated = require('../../../middleware/isAuthenticated')


// read all (HA and R)
router.get('/', async(req, res)=>{
    try {
        const allHotelAdmins = await pool.query('SELECT * FROM hoteladmin_login')
        const allReceptionists = await pool.query('SELECT * FROM user_login')

        res.render('HA/users/users', {
            allHotelAdminsArray: allHotelAdmins.rows,
            allReceptionistsArray: allReceptionists.rows
        })

    } catch (error) {
        console.error(error.message)
    }
})


// R user management
// add 
router.post('/', async(req, res)=>{
    try {
        const { fullname, username, password } = req.body
        const hotelid = req.session.hotelID

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newReceptionist = await pool.query(`INSERT INTO user_login(fullname, username, hashpassword, hotelid) VALUES($1, $2, $3, $4) RETURNING *`,
            [fullname, username, hashedPassword, hotelid]
        )

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})


// render edit form
router.get("/edit/R/:id", async(req, res)=>{
    try {
        const { id } = req.params
        const user = await pool.query('SELECT * FROM user_login WHERE userid = $1', [id])

        res.render('HA/users/editR', {
            r: user.rows[0]
        })
    } catch (error) {
        console.error(error.message)
    }
})
// edit one
router.post("/edit/receptionist/:id", async(req, res)=>{
    try {
        const { id } = req.params
        const { name, username } = req.body
        const editReceptionist = await pool.query(`UPDATE user_login
            SET fullname = $1, 
                username = $2
            WHERE userid = $3`,
            [name, username, id]
        )

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})


// delete one
router.post('/delete/:id', async(req,res)=>{
    try {
        const { id } = req.params
        const deleteReceptionist = await pool.query('DELETE FROM user_login WHERE userid = $1', [id])

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})


// render change pw form
router.get('/changePW/R/:id', (req, res)=>{
    const { id } = req.params
    res.render('HA/users/changePWr', {
        id: id
    })
})
// change pw
router.post('/changePW/receptionist/:id', async(req, res)=>{
    const { id } = req.params
    const { oldPassword, newPassword, confirmPassword } = req.body

    // get old hashpassword
    const result = await pool.query('SELECT * FROM user_login WHERE userid = $1', [id])
    const hashedOldPassword = result.rows[0].hashpassword

    // compare old password with old hashpassword
    const isPasswordValid = bcrypt.compare(oldPassword, hashedOldPassword);

    if (!isPasswordValid) {
        res.send('Wrong old password')
      }

    // compare new and confirm password
    if (newPassword !== confirmPassword) {
        res.send('New password and confirm password do not match')
    }

    // hash new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    await pool.query('UPDATE user_login SET hashpassword = $1 WHERE userid = $2', [hashedNewPassword, id])

    res.redirect('/users')
})


// HA user management
// render edit form
router.get("/edit/HA/:id", async(req, res)=>{
    try {
        const { id } = req.params
        const user = await pool.query('SELECT * FROM hoteladmin_login WHERE userid = $1', [id])

        res.render('HA/users/editHA', {
            ha: user.rows[0]
        })
    } catch (error) {
        console.error(error.message)
    }
})
// edit one
router.post("/edit/hoteladmin/:id", async(req, res)=>{
    try {
        const { id } = req.params
        const { username } = req.body
        const editHotelAdmin = await pool.query(`UPDATE hoteladmin_login
            SET username = $1
            WHERE userid = $2`,
            [username, id]
        )

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})


// render change pw form
router.get('/changePW/HA/:id', (req, res)=>{
    const { id } = req.params
    res.render('HA/users/changePWha', {
        id: id
    })
})
// change pw
router.post('/changePW/hoteladmin/:id', async(req, res)=>{
    const { id } = req.params
    const { oldPassword, newPassword, confirmPassword } = req.body

    // get old hashpassword
    const result = await pool.query('SELECT * FROM hoteladmin_login WHERE userid = $1', [id])
    const hashedOldPassword = result.rows[0].hashpassword

    // compare old password with old hashpassword
    const isPasswordValid = bcrypt.compare(oldPassword, hashedOldPassword);

    if (!isPasswordValid) {
        res.send('Wrong old password')
      }

    // compare new and confirm password
    if (newPassword !== confirmPassword) {
        res.send('New password and confirm password do not match')
    }

    // hash new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    await pool.query('UPDATE hoteladmin_login SET hashpassword = $1 WHERE userid = $2', [hashedNewPassword, id])

    res.redirect('/users')
})




module.exports = router