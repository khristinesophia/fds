const express = require('express')
const router = express.Router()


router.post('/superadmin', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/login/SAform');
    })
})

router.post('/hoteladmin', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/login/HAform');
    })
})


module.exports = router
