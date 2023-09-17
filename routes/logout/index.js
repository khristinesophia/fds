const express = require('express')
const router = express.Router()


router.post('/superadmin', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/login/SAform');
    })
})


module.exports = router