const { Pool } = require("pg");
const pool = new Pool({
  user: "mtechub",
  host: "localhost",
  database: "user_db",
  password: "mtechub123",
  port: 5432,
});

module.exports = pool;
