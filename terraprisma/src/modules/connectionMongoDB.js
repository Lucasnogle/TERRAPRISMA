const { MongoClient } = require('mongodb');
const config = require('../config');

let client = null;
let db = null;

const getConnection = async () => {
    if (db) return db;
    try {
        client = new MongoClient(config.mongoDB.uri);
        await client.connect();
        db = client.db(config.mongoDB.dbName);
        console.log('Conectado ao MongoDB');
        return db;
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        throw error;
    }
};

module.exports = { getConnection };
