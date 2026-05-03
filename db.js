const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let client;
let db;

async function connectDB() {
    if (db) return { db, client };
    try {
        console.log('Tentando conectar ao MongoDB em:', uri);
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        console.log('Conectado ao MongoDB');
        db = client.db(dbName);
        
        // Criar índice único no email
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        
        // Criar índice para mensagens (otimiza o polling do chat)
        await db.collection('messages').createIndex({ senderId: 1, receiverId: 1, timestamp: 1 });
        
        return { db, client };
    } catch (error) {
        console.error('ERRO CRÍTICO: Não foi possível conectar ao MongoDB.');
        console.error('Detalhes do erro:', error.message);
        process.exit(1);
    }
}

function getDB() {
    if (!db) {
        throw new Error('Banco de dados não inicializado. Chame connectDB primeiro.');
    }
    return db;
}

module.exports = { connectDB, getDB };
