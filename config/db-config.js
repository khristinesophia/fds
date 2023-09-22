const Pool = require('pg').Pool

const pool = new Pool({
    user: 'postgres',
    password: 'acis2023',
    host: 'localhost',
    port: 5432, 
    database: 'fds'
})

module.exports = pool;