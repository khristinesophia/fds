const Pool = require('pg').Pool

const pool = new Pool({
    user: 'fds_l8en_user',
    password: 'rLy8MxUvgjr5SC1sMkISpbvMqlcdJjzU',
    host: 'dpg-cpg1lo779t8c73ebtcig-a',
    port: 5432, 
    database: 'fds_l8en'
})


// const pool = new Pool({
//     user: 'postgres',
//     password: 'acis',
//     host: 'localhost',
//     port: 5432, 
//     database: 'fds'
// })


module.exports = pool;
