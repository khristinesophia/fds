const express = require('express')
const router = express.Router()
const pool = require('../../config/db-config')
const bcrypt = require('bcrypt');

const isAuthenticated = require('../../middleware/isAuthenticated')


// add 
router.post('/', async(req, res)=>{
    try {
        const { fullname, addusername, password } = req.body

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newSuperAdmin = await pool.query(`INSERT INTO superadmin_login(fullname, username, hashpassword) VALUES($1, $2, $3) RETURNING *`,
            [fullname, addusername, hashedPassword]
        )

        res.redirect('/superadmins')
    } catch (error) {
        console.error(error.message)
    }
})


// read all
router.get('/', async(req, res)=>{
    try {
        const allSuperAdmins = await pool.query('SELECT * FROM superadmin_login')

        // res.json(allSuperAdmins.rows) array of all 
        res.render('SAs/superadmins', {
            allSuperAdminsArray: allSuperAdmins.rows
        })

    } catch (error) {
        console.error(error.message)
    }
})


// render edit form
router.get("/editSA/:id", async(req, res)=>{
    try {
        const { id } = req.params
        const superAdmin = await pool.query('SELECT * FROM superadmin_login WHERE superadminid = $1', [id])

        res.render('SAs/editSA', {
            sa: superAdmin.rows[0]
        })
    } catch (error) {
        console.error(error.message)
    }
})


// edit one
router.post("/edit/:id", async(req, res)=>{
    try {
        const { id } = req.params
        const { name, username } = req.body
        const editSuperAdmin = await pool.query(`UPDATE superadmin_login
            SET fullname = $1, username = $2
            WHERE superadminid = $3`,
            [name, username, id]
        )

        res.redirect('/superadmins')
    } catch (error) {
        console.error(error.message)
    }
})


// delete one
router.post('/delete/:id', async(req,res)=>{
    try {
        const { id } = req.params
        const deleteSuperAdmin = await pool.query('DELETE FROM superadmin_login WHERE superadminid = $1', [id])

        res.redirect('/superadmins')
    } catch (error) {
        console.error(error.message)
    }
})




// render change pw form
router.get('/changePW/:id', (req, res)=>{
    const { id } = req.params
    res.render('SAs/changePW', {
        id: id
    })
})
// change pw
router.post('/changepassword/:id', async(req, res)=>{
    const { id } = req.params
    const { oldPassword, newPassword, confirmPassword } = req.body

    // get old hashpassword
    const result = await pool.query('SELECT * FROM superadmin_login WHERE superadminid = $1', [id])
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

    await pool.query('UPDATE superadmin_login SET hashpassword = $1 WHERE superadminid = $2', [hashedNewPassword, id])

    res.redirect('/superadmins')
})




module.exports = router