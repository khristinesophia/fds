const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const bcrypt = require('bcrypt');

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getCurrentDate = require(path.join(__basedir, 'utils', 'getCurrentDate'))




// add 
router.post('/', isAuthenticated, async(req, res)=>{
    try {
        const { fullname, username, password } = req.body
        const hashedPassword = bcrypt.hashSync(password, 10);
        const datecreated = getCurrentDate()

        const newSuperAdmin = await pool.query(`INSERT INTO superadmin_login(fullname, username, hashpassword, datecreated) VALUES($1, $2, $3, $4) RETURNING *`,
            [fullname, username, hashedPassword, datecreated]
        )

        res.redirect('/superadmins')
    } catch (error) {
        console.error(error.message)
    }
})

// read all
router.get('/', isAuthenticated, async(req, res)=>{
    try {
        const allSuperAdmins = await pool.query('SELECT * FROM superadmin_login')

        res.render('SA/SAs/superadmins', {
            allSuperAdminsArray: allSuperAdmins.rows
        })

    } catch (error) {
        console.error(error.message)
    }
})


// render edit form
router.get("/editSA/:id", isAuthenticated, async(req, res)=>{
    try {
        const { id } = req.params
        const superAdmin = await pool.query('SELECT * FROM superadmin_login WHERE userid = $1', [id])

        res.render('SA/SAs/editSA', {
            sa: superAdmin.rows[0]
        })
    } catch (error) {
        console.error(error.message)
    }
})
// edit one
router.post("/edit/:id", isAuthenticated, async(req, res)=>{
    try {
        const { id } = req.params
        const { name, username } = req.body
        const editSuperAdmin = await pool.query(`UPDATE superadmin_login
            SET fullname = $1, 
                username = $2
            WHERE userid = $3`,
            [name, username, id]
        )

        res.redirect('/superadmins')
    } catch (error) {
        console.error(error.message)
    }
})


// delete one
router.post('/delete/:id', isAuthenticated, async(req,res)=>{
    try {
        const { id } = req.params
        const deleteSuperAdmin = await pool.query('DELETE FROM superadmin_login WHERE userid = $1', [id])

        res.redirect('/superadmins')
    } catch (error) {
        console.error(error.message)
    }
})


// render change pw form
router.get('/changePW/:id', (req, res)=>{
    const { id } = req.params
    res.render('SA/SAs/changePW', {
        id: id
    })
})
// change pw
router.post('/changepassword/:id', async(req, res)=>{
    const { id } = req.params
    const { oldPassword, newPassword, confirmPassword } = req.body

    // get old hashpassword
    const result = await pool.query('SELECT * FROM superadmin_login WHERE userid = $1', [id])
    const hashedOldPassword = result.rows[0].hashpassword

    // compare old password with old hashpassword
    const isPasswordValid = await bcrypt.compare(oldPassword, hashedOldPassword);

    if (!isPasswordValid) {
        console.log('Wrong old password')
    }

    // compare new and confirm password
    if (newPassword !== confirmPassword) {
        console.log('New password and confirm password do not match')
    }

    // hash new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    await pool.query('UPDATE superadmin_login SET hashpassword = $1 WHERE userid = $2', [hashedNewPassword, id])

    res.redirect('/superadmins')
})




module.exports = router