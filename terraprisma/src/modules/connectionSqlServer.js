const sql = require('mssql');
const config = require('../config');

let pool = null;

const getConnection = async () => {
    if (pool) return pool;
    try {
        pool = await sql.connect(config.sqlServer);
        console.log('Conectado ao SQL Server');
        return pool;
    } catch (error) {
        console.error('Erro ao conectar ao SQL Server:', error);
        throw error;
    }
};

const query = async (queryString, params = []) => {
    const pool = await getConnection();
    const request = pool.request();
    params.forEach((param, index) => request.input(`param${index}`, param));
    return await request.query(queryString);
};

module.exports = { getConnection, query };
