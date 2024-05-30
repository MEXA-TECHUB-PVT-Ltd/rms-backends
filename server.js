require("dotenv").config("./.env");

const app = require("./src/app");
const initializeDatabase = require("./src/initialize-db");

const PORT = process.env.PORT || 3000;
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
