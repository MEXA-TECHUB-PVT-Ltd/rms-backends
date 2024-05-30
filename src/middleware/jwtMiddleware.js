const jwt = require("jsonwebtoken");
const { handleResponse } = require("../utilities/responseHandlers");

const verifyToken = (req, res, next) => {
  // Extract the token from the request's authorization header
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Authorization: Bearer TOKEN

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return handleResponse(res, "Invalid token", 403, []);
      }

      req.user = user; // Add the user payload to the request object
      next(); // Proceed to the next middleware or route handler
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

module.exports = {
  verifyToken,
};
