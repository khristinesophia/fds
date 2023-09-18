const express = require('express')
const app = express()

const path = require('path')
const methodOverride = require('method-override')
const session = require('express-session')

// middlewares
app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(methodOverride('_method'));
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
const hotels = require('./routes/hotels')
const hoteladmins = require('./routes/hoteladmins')
const superadmins = require('./routes/superadmins')

// register routes as middleware
app.use('/login', login)
app.use('/logout', logout)
app.use('/hotels', hotels)
app.use('/hoteladmins', hoteladmins)
app.use('/superadmins', superadmins)


app.get('/', (req, res) => {
    res.send('Hello world')
})


const PORT = 5000
app.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`)
})
