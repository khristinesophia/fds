const express = require('express')
const app = express()

const path = require('path')
global.__basedir = __dirname

const methodOverride = require('method-override')
const session = require('express-session')

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(methodOverride('_method'))
app.use(session({
    secret: 'abcd123456789',
    resave: false,
    saveUninitialized: true
}))


// set pug as view engine
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// routes
const login = require('./routes/login')
const logout = require('./routes/logout')
    // superadmin user routes
const hotels = require('./routes/SA/hotels')
const hsadmins = require('./routes/SA/hsadmins')
const superadmins = require('./routes/SA/superadmins')
const settings = require('./routes/SA/settings')
    // dashboard route
const dashboard = require('./routes/dashboard')
    // hotel system admin user routes
const setup = require('./routes/HSA/setup')
const profile = require('./routes/HSA/profile')
const users = require('./routes/HSA/users')
const HSArooms = require('./routes/HSA/HSArooms')
const roomtype = require('./routes/HSA/roomtype')
const pd = require('./routes/HSA/pd')
const reports = require('./routes/HSA/reports')
const forofor = require('./routes/HSA/404')
    // receptionist user routes
const Rrooms = require('./routes/receptionist/Rrooms')
const reservation = require('./routes/receptionist/reservation')
const guestaccounts = require(path.join(__basedir, 'routes', 'receptionist', 'guestaccounts'))
const archivedga = require(path.join(__basedir, 'routes', 'receptionist', 'archivedga'))
const reservationhist = require(path.join(__basedir, 'routes', 'receptionist', 'reservationhist'))

// register routes as middleware
app.use('/login', login)
app.use('/logout', logout)
    // superadmin user routes
app.use('/hotels', hotels)
app.use('/hsadmins', hsadmins)
app.use('/superadmins', superadmins)
app.use('/settings', settings)
    // dashboard route
app.use('/dashboard', dashboard)
    // hotel admin user routes
app.use('/setup', setup)
app.use('/profile', profile)
app.use('/users', users)
app.use('/HSArooms', HSArooms)
app.use('/roomtype', roomtype)
app.use('/pd', pd)
app.use('/reports', reports)
    // receptionist user routes
app.use('/Rrooms', Rrooms)
app.use('/reservation', reservation)
app.use('/ga', guestaccounts)
app.use('/archivedga', archivedga)
app.use('/rhist', reservationhist)
app.use('/404', forofor)


// app.get('/', (req, res) => {
//     res.render('landing')
// })

app.get('/', (req, res)=>{
    res.render('login/loginSA', {
        route: "/login"
    })
})


const PORT = 5000
app.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`)
})
