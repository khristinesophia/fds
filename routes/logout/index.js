const express = require('express')
const router = express.Router()


router.post('/superadmin', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/login/SA');
    })
})

router.post('/hoteladmin', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/login/HA');
    })
})

router.post('/receptionist', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/login/R');
    })
})


module.exports = router
