const mysql = require("mysql2/promise");
const cfg = require("./config");

const pool = mysql.createPool({
  host: cfg.MYSQL_HOST,
  port: cfg.MYSQL_PORT,
  user: cfg.MYSQL_USER,
  password: cfg.MYSQL_PASSWORD,
  database: cfg.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

module.exports = { pool, initDb };
