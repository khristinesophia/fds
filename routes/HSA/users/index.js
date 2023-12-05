//- import path
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- bcrypt package
const bcrypt = require('bcrypt');

//- middleware
const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))

const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))
const getHotelLogo = require(path.join(__basedir, 'middleware', 'getHotelLogo'))

//- utils
const getCurrentDate = require(path.join(__basedir, 'utils', 'getCurrentDate'))
const {formatTime} = require(path.join(__basedir, 'utils', 'formatTime'))




//- add shift
//- 'users/addshift'
router.post('/addshift', isAuthenticated, async(req,res)=>{
    const { hotelID } = req.session
    const { shiftname, starthour, endhour } = req.body

    const q1result = await pool.query(`
        INSERT INTO shifts (hotelid, shiftname, starthour, endhour)
        VALUES($1, $2, $3, $4)
    `, [hotelID, shiftname, starthour, endhour])

    res.redirect('/users')
})

//- edit shift
//- 'users/shift/edit/:id'
router.post('/shift/edit/:id', isAuthenticated, async(req,res)=>{
    const { hotelID } = req.session
    const { id } = req.params
    const { shiftname, starthour, endhour } = req.body

    console.log(req.body)

    const q1result = await pool.query(`
        UPDATE shifts 
        SET shiftname = $1, 
            starthour = $2, 
            endhour = $3
        WHERE shiftid = $4 AND 
            hotelid = $5
    `, [shiftname, starthour, endhour, id, hotelID])

    res.redirect('/users')
})

//- delete shift
//- 'users/shift/delete/:id'
router.post('/shift/delete/:id', isAuthenticated, async(req,res)=>{
    try {
        const { id } = req.params
        const dq1result = await pool.query('DELETE FROM shifts WHERE shiftid = $1', [id])

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})




//- render "users" page
router.get('/', isAuthenticated, getHotelColor, getHotelLogo, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID
    
        const { userID } = req.session
        const managerRole = req.session.managerRole

        const allHSAdmins = await pool.query(`
            SELECT * 
            FROM hoteladmin_login t1
            LEFT JOIN shifts t2
                ON t1.shiftid = t2.shiftid
            WHERE t1.hotelid = $1
        `, [hotelid])

        const allReceptionists = await pool.query(`
            SELECT * 
            FROM user_login t1
            LEFT JOIN shifts t2
                ON t1.shiftid = t2.shiftid
            WHERE t1.hotelid = $1
        `, [hotelid])

        const allShifts = await pool.query('SELECT * FROM shifts WHERE hotelid = $1 ORDER BY starthour ASC', [hotelid])
        allShifts.rows.forEach(row=>{
            if(row.starthour){
                row.starthour = formatTime(row.starthour)
            }
            if(row.endhour){
                row.endhour = formatTime(row.endhour)
            }
        })

        res.render('HSA/users/users', {
            allHSAdminsArray: allHSAdmins.rows,
            allReceptionistsArray: allReceptionists.rows,
            allShiftsArray: allShifts.rows,
            hotelColor: req.hotelColor,
            hotelLogo: req.hotelImage,
            managerRole: managerRole,
            userID: userID
        })

    } catch (error) {
        console.error(error.message)
    }
})


//- add receptionist
router.post('/', isAuthenticated, async(req, res)=>{
    try {
        const { fullname, username, email, password } = req.body
        const hotelid = req.session.hotelID

        

        const hashedPassword = bcrypt.hashSync(password, 10);
        const datecreated = getCurrentDate()

        const newReceptionist = await pool.query(`INSERT INTO user_login(fullname, username, email, hashpassword, hotelid, datecreated) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
            [fullname, username, email, hashedPassword, hotelid, datecreated]
        )

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})

//- edit receptionist
router.post("/edit/receptionist/:id", isAuthenticated, async(req, res)=>{
    try {
        const { id } = req.params
        const { name, email, username, shiftid} = req.body

        let { onshift_mon, onshift_tues, onshift_wed, onshift_thurs, onshift_fri, onshift_sat, onshift_sun } = req.body

        //- mon
        if(onshift_mon === 'on'){
            onshift_mon = true
        } else{
            onshift_mon = false
        }
        //- tues
        if(onshift_tues === 'on'){
            onshift_tues = true
        } else{
            onshift_tues = false
        }
        //- wed
        if(onshift_wed === 'on'){
            onshift_wed = true
        } else{
            onshift_wed = false
        }
        //- thurs
        if(onshift_thurs === 'on'){
            onshift_thurs = true
        } else{
            onshift_thurs = false
        }
        //- fri
        if(onshift_fri === 'on'){
            onshift_fri = true
        } else{
            onshift_fri = false
        }
        //- sat
        if(onshift_sat === 'on'){
            onshift_sat = true
        } else{
            onshift_sat = false
        }
        //- sun
        if(onshift_sun === 'on'){
            onshift_sun = true
        } else{
            onshift_sun = false
        }

        const editReceptionist = await pool.query(`UPDATE user_login
            SET fullname = $1, 
                username = $2,
                email = $3,
                shiftid = $4,
                onshift_mon = $5,
                onshift_tues = $6,
                onshift_wed = $7,
                onshift_thurs = $8,
                onshift_fri = $9,
                onshift_sat = $10,
                onshift_sun = $11
            WHERE userid = $12`,
            [   
                name, username, email, shiftid,
                onshift_mon, onshift_tues, onshift_wed, onshift_thurs, onshift_fri, onshift_sat, onshift_sun,
                id
            ]
        )

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})

//- delete receptionist
router.post('/delete/:id', isAuthenticated,async(req,res)=>{
    try {
        const { id } = req.params

        const hotelid = req.session.hotelID

        const users = await pool.query('SELECT * FROM user_login WHERE userid = $1 AND hotelid = $2', [id, hotelid]);
        const r = users.rows[0];


        //- insert in hist_rooms T for archive 
        const q3 = `
            INSERT INTO hist_users(userid, hotelid, fullname, username, hashpassword, datecreated, email, emptype)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `
        const q3result = await pool.query(q3, [id, r.hotelid, r.fullname, r.username, r.hashpassword, r.datecreated, r.email, 'Receptionist'])

        const deleteReceptionist = await pool.query('DELETE FROM user_login WHERE userid = $1', [id])

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})

//- change password receptionist
router.post('/changePW/receptionist/:id', isAuthenticated, async(req, res)=>{
    const { id } = req.params
    const { oldPassword, newPassword, confirmPassword } = req.body

    // get old hashpassword
    const result = await pool.query('SELECT * FROM user_login WHERE userid = $1', [id])
    const hashedOldPassword = result.rows[0].hashpassword

    // compare old password with old hashpassword
    const isPasswordValid = await bcrypt.compare(oldPassword, hashedOldPassword);

    if (!isPasswordValid) {
        console.log('Wrong old password')
        // Send an error response with the message
        return res.status(400).json({ error: 'Wrong old password. Please try again.' });
      }

    // compare new and confirm password
    if (newPassword !== confirmPassword) {
        console.log('New password and confirm password do not match')
        // Send an error response with the message
        return res.status(400).json({ error: 'New password and confirm password do not match. Please try again.' });
    }

    // hash new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    await pool.query('UPDATE user_login SET hashpassword = $1 WHERE userid = $2', [hashedNewPassword, id])

    // Send a success response
    return res.status(200).json({ message: 'Password updated successfully.' });

})



//- add other manager
router.post('/addmanager', isAuthenticated, async (req, res) => {
    try {
        const { hotelID } = req.session
        const { username, email, password } = req.body;

        // Check password length
        if (password.length < 8) {
            return res.status(400).send('Password must be at least 8 characters');
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const datecreated = getCurrentDate();

        const newHotelAdmin = await pool.query(
            `INSERT INTO hoteladmin_login(username, email, hashpassword, firstlogin, hotelid, datecreated, role) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [username, email, hashedPassword, true, hotelID, datecreated, 'Viewer']
        );

        res.redirect('/users')
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error')
    }
})

//- update hsa
router.post("/edit/manager/:id", isAuthenticated, async(req, res)=>{
    try {

        const { id } = req.params
        const { email, username, shiftid} = req.body

        let { onshift_mon, onshift_tues, onshift_wed, onshift_thurs, onshift_fri, onshift_sat, onshift_sun } = req.body

        //- mon
        if(onshift_mon === 'on'){
            onshift_mon = true
        } else{
            onshift_mon = false
        }
        //- tues
        if(onshift_tues === 'on'){
            onshift_tues = true
        } else{
            onshift_tues = false
        }
        //- wed
        if(onshift_wed === 'on'){
            onshift_wed = true
        } else{
            onshift_wed = false
        }
        //- thurs
        if(onshift_thurs === 'on'){
            onshift_thurs = true
        } else{
            onshift_thurs = false
        }
        //- fri
        if(onshift_fri === 'on'){
            onshift_fri = true
        } else{
            onshift_fri = false
        }
        //- sat
        if(onshift_sat === 'on'){
            onshift_sat = true
        } else{
            onshift_sat = false
        }
        //- sun
        if(onshift_sun === 'on'){
            onshift_sun = true
        } else{
            onshift_sun = false
        }

        const editHotelAdmin = await pool.query(`UPDATE hoteladmin_login
            SET username = $1,
                email = $2,
                shiftid = $3,
                onshift_mon = $4,
                onshift_tues = $5,
                onshift_wed = $6,
                onshift_thurs = $7,
                onshift_fri = $8,
                onshift_sat = $9,
                onshift_sun = $10
            WHERE userid = $11`,
            [   
                username, email, shiftid,
                onshift_mon, onshift_tues, onshift_wed, onshift_thurs, onshift_fri, onshift_sat, onshift_sun,
                id
            ]
        )

        res.redirect('/users')
    } catch (error) {
        console.error(error.message)
    }
})

//- change password hsa
router.post('/changePW/manager/:id', isAuthenticated, async(req, res)=>{
    const { id } = req.params
    const { oldPassword, newPassword, confirmPassword } = req.body

    // get old hashpassword
    const result = await pool.query('SELECT * FROM hoteladmin_login WHERE userid = $1', [id])
    const hashedOldPassword = result.rows[0].hashpassword

    // compare old password with old hashpassword
    const isPasswordValid = await bcrypt.compare(oldPassword, hashedOldPassword);

    if (!isPasswordValid) {
        console.log('Wrong old password')
        // Send an error response with the message
        return res.status(400).json({ error: 'Wrong old password. Please try again.' });
   
      }

    // compare new and confirm password
    if (newPassword !== confirmPassword) {
        console.log('New password and confirm password do not match')
        // Send an error response with the message
        return res.status(400).json({ error: 'New password and confirm password do not match. Please try again.' });
    }

    // hash new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    await pool.query('UPDATE hoteladmin_login SET hashpassword = $1 WHERE userid = $2', [hashedNewPassword, id])

    // Send a success response
    return res.status(200).json({ message: 'Password updated successfully.' });
})








module.exports = router