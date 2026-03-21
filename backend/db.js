const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexão:', err);
});

// Testa a conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error(' Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log(' Conectado ao PostgreSQL (Neon) com sucesso!');
  }
});

module.exports = pool;
