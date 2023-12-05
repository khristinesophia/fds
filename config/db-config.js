const Pool = require('pg').Pool

<<<<<<< HEAD
// const pool = new Pool({
//     user: 'acis',
//     password: 'Ofdvpi7BxtIJ9KwisfYOc6nGb5HWAbLN',
//     host: 'dpg-clha9hmbbf9s73b0brp0-a',
//     port: 5432, 
//     database: 'fds'
// })


=======
>>>>>>> main
const pool = new Pool({
    user: 'postgres',
    password: 'acis',
    host: 'localhost',
    port: 5432, 
    database: 'fds'
})

<<<<<<< HEAD
=======
// const pool = new Pool({
//     user: 'acis',
//     password: 'Ofdvpi7BxtIJ9KwisfYOc6nGb5HWAbLN',
//     host: 'dpg-clha9hmbbf9s73b0brp0-a',
//     port: 5432, 
//     database: 'fds'
// })

>>>>>>> main

module.exports = pool;
