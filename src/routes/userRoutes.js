const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const UserController = require("../controller/userController");

// validation scheme
const {
  userBodySchema,
  userIdParamSchema,
  userRegisterBodySchema,
  userLoginBodySchema,
} = require("../validations/userValidation");
const { handleResponse } = require("../utilities/responseHandlers");
// middleware for validation
const {
  validateBody,
  validateParam,
} = require("../middleware/validationsMiddleware");
const { verifyToken } = require("../middleware/jwtMiddleware");

// register user

router.post(
  "/register",
  validateBody(userRegisterBodySchema),
  UserController.registerUser
);

router.post(
  "/login",
  validateBody(userLoginBodySchema),
  UserController.loginUser
);
router.post("/user", validateBody(userBodySchema), UserController.createUser);
// test login

router.get("/users", verifyToken, UserController.getUsers);
router.get(
  "/user/:id",
  validateParam(userIdParamSchema, "id"),
  verifyToken,
  UserController.getUser
);
router.put(
  "/user/:id",
  validateParam(userIdParamSchema, "id"),
  verifyToken,
  UserController.updateUser
);
router.delete("/user/:id", verifyToken, UserController.deleteUser);
// veification email :

router.post("/forget-password", UserController.forgetPassword);
// router.post("/send-email", emailController.testMail);

module.exports = router;
