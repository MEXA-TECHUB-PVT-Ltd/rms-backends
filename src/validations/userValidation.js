const Joi = require("joi");

const userBodySchema = Joi.object({
  name: Joi.string().required().min(3),
  email: Joi.string().email().required(),
});
const userRegisterBodySchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .required()
    .pattern(new RegExp("(?=.*[a-z])"))
    // At least one uppercase letter
    .pattern(new RegExp("(?=.*[A-Z])"))
    // At least one digit
    .pattern(new RegExp("(?=.*[0-9])"))
    // At least one special character
    .pattern(new RegExp("(?=.*[!@#$%^&*])"))
    // At least six characters long
    .min(6)
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "string.pattern.base":
        "Password must include at least one lowercase letter, one uppercase letter, one number, and one special character",
    }),
});
const userLoginBodySchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const userIdParamSchema = Joi.object({
  id: Joi.required(), // Adjust this based on your parameter requirements
});

module.exports = {
  userBodySchema,
  userIdParamSchema,
  userRegisterBodySchema,
  userLoginBodySchema,
};
