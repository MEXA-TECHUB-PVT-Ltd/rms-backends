//
const { handleResponse } = require("../utilities/responseHandlers");

// Middleware for validation
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    // const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return handleResponse(res, error.details[0].message, 400, []);
    }
    next();
  };
};

// Middleware for parameter validation
const validateParam = (schema, name) => {
  return (req, res, next) => {
    const { error } = schema.validate({ [name]: req.params[name] });
    if (error) {
      return handleResponse(res, error.details[0].message, 400, []);
    }
    next();
  };
};

module.exports = {
  validateBody,
  validateParam,
};
