import mysql from 'mysql2/promise';
import 'dotenv/config';

const db = mysql.createPool({
    host: 'market_db', 
    user: process.env.DB_USER,      
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,  
    port: 3306, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


export default db;