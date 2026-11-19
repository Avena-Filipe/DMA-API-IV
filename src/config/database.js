const mongoose = require('mongoose');
async function connectDatabase() {
  if (!process.env.MONGO_URL) throw new Error('MONGO_URL ausente no .env.');
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: process.env.DB_NAME || 'tecnologias_programacao'
  });
  console.log('MongoDB conectado com sucesso');
}
module.exports = connectDatabase;
