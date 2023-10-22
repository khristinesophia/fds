/*const path = require('path')

const express = require('express')
const router = express.Router()
const pool = require(path.join(__basedir, 'config', 'db-config'))

const bcrypt = require('bcrypt');

const isAuthenticated = require(path.join(__basedir, 'middleware', 'isAuthenticated'))
const getCurrentDate = require(path.join(__basedir, 'utils', 'getCurrentDate'))
const getHotelColor = require(path.join(__basedir, 'middleware', 'getHotelColor'))

const publishable_key = "pk_test_51O2GkmHA4o9CYWEUettB5e5NwxOnRgiVRGuTjp8M6lHFQoI5RHZVvximTqutedm8qCKmUluqtA5dGM8tHQ1QJeZg00AM4TLx4u"
const secret_key = "sk_test_51O2GkmHA4o9CYWEUZkJlQGpj7gJ8sDZO8YQzyvWT1JQiWcqsfTy6yzMxMoVZnorhCKtD3hQV1eJfWyVYu1kCLlgL00rA5p5YA9"

const stripe = require('stripe')(secret_key) 

// display reservation form
router.get('/reservation', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID

        res.render('receptionist/reservation/reservation', {
            key: publishable_key,
            hotelColor: req.hotelColor  
        });

    } catch (error) {
        console.error(error.message)
    }
})

// sample add payment
router.get('/reservation', isAuthenticated, getHotelColor, async(req, res)=>{
    try {
        const hotelid = req.session.hotelID

        stripe.customers.create({
            email:req.body.stripeEmail,
            source:req.body.stripeToken,
            name:'CJ Cantilado',
            address:'123 Baesa, Quezon City'
        })
        .then((customer) => {
            return stripe.charges.create({
                amount:7000,
                description:'Hotel Online Reservation' ,
                currency:'Pesos' ,
                customer:customer.id
            })
        })
        .then((charge) => {
            console.log(charge)
            res.send("Sucess Payment");
        })

        res.render('receptionist/reservation/reservation', {
            hotelColor: req.hotelColor  
        });

    } catch (error) {
        console.error(error.message)
    }
})






module.exports = router*/