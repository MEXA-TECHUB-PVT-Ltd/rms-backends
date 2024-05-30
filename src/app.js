const express = require("express");
const app = express();

const userRoutes = require("./routes/userRoutes");
const { handleResponse } = require("./utilities/responseHandlers");
app.use(express.json());
app.use("/api", userRoutes);
// Import and use your routes here

app.get("/", (req, res) =>
  handleResponse(res, "Welcome to the API", 200, null)
);
app.get("*", (req, res) => handleResponse(res, "Route not found", 404, null));
module.exports = app;
