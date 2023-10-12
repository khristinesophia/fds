const express = require('express')
const router = express.Router()




//- "/logout" route
router.post('/', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/');
    })
})


//- "/logout/superadmin" route
router.post('/superadmin', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/login/SA');
    })
})

//- "/logout/hsadmin" route
router.post('/hsadmin', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/login/HSA');
    })
})

//- "/logout/receptionist" route
router.post('/receptionist', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/login/R');
    })
})


module.exports = router
