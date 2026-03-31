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
      is_makeBot TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Add is_makeBot column to existing tables that may not have it yet
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_makeBot TINYINT(1) NOT NULL DEFAULT 0;
  `).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bot_commands (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      command VARCHAR(255) NOT NULL,
      response TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_command (user_id, command),
      CONSTRAINT fk_bot_commands_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

module.exports = { pool, initDb };
