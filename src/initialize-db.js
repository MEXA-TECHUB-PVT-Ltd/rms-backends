const pool = require("./config/db"); // Adjust the path to wherever your db.js is located

async function initializeDatabase() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100),
      email VARCHAR(100),
      password VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err, res) => {
      if (err) {
        console.error(err);
        return;
      } else {
        console.log("Table created successfully");
      }
    }
  );
}

module.exports = initializeDatabase;
