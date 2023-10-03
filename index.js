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
const hoteladmins = require('./routes/SA/hoteladmins')
const superadmins = require('./routes/SA/superadmins')
    // dashboard route
const dashboard = require('./routes/dashboard')
    // hotel admin user routes
const setup = require('./routes/HA/setup')
const profile = require('./routes/HA/profile')
const users = require('./routes/HA/users')
const HArooms = require('./routes/HA/HArooms')
const roomtype = require('./routes/HA/roomtype')
    // receptionist user routes
const Rrooms = require('./routes/receptionist/Rrooms')

    // register routes as middleware
app.use('/login', login)
app.use('/logout', logout)
    // superadmin user routes
app.use('/hotels', hotels)
app.use('/hoteladmins', hoteladmins)
app.use('/superadmins', superadmins)
    // dashboard route
app.use('/dashboard', dashboard)
    // hotel admin user routes
app.use('/setup', setup)
app.use('/profile', profile)
app.use('/users', users)
app.use('/HArooms', HArooms)
app.use('/roomtype', roomtype)
    // receptionist user routes
app.use('/Rrooms', Rrooms)


app.get('/', (req, res) => {
    res.render('landing')
})


const PORT = 5000
app.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`)
})
