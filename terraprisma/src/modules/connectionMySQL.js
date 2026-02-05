const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;

const getConnection = async () => {
    if (pool) return pool;
    try {
        pool = mysql.createPool({
            host: config.mySQL.host,
            user: config.mySQL.user,
            password: config.mySQL.password,
            database: config.mySQL.database,
            port: config.mySQL.port,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
        console.log('Pool MySQL criado');
        return pool;
    } catch (error) {
        console.error('Erro ao criar pool MySQL:', error);
        throw error;
    }
};

const query = async (queryString, params = []) => {
    const pool = await getConnection();
    const [rows] = await pool.execute(queryString, params);
    return rows;
};

module.exports = { getConnection, query };
