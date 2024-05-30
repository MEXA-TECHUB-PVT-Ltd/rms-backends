const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { handleResponse } = require("../utilities/responseHandlers");
const statusCodes = require("../utilities/statusCodes");
const { sendMail } = require("../services/emailSending");
const e = require("express");
// register user
exports.registerUser = async function (req, res) {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 12);
  try {
    // Check if user already exists
    const { rows: existingUsers } = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUsers.length > 0) {
      return handleResponse(
        res,
        "User with this email already exists",
        400,
        []
      );
    }
    // Save the new user
    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
      [email, hashedPassword]
    );
    handleResponse(res, "User registered successfulldy", 400, newUser.rows);
  } catch (error) {
    console.error(error);
    handleResponse(res, "An error occurred", 404, []);
  }
};
// login user

exports.loginUser = async function (req, res) {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length > 0) {
      const validPassword = await bcrypt.compare(
        password,
        user.rows[0].password
      );
      if (validPassword) {
        // User authenticated, generate JWT token
        const token = jwt.sign(
          { userId: user.rows[0].id, email: user.rows[0].email }, // Payload
          process.env.JWT_SECRET, // Secret key, should be in your environment variables
          // { expiresIn: "1h" } // Token expiry
          // 1min for testing
          { expiresIn: "1min" }
        );

        // Send the token in the response
        handleResponse(res, "Login successful", 200, {
          token: token,
          user: user.rows[0],
        });
      } else {
        // Password does not match
        handleResponse(res, "Invalid password", 401, []);
      }
    } else {
      handleResponse(res, "User not found", 404, []);
    }
  } catch (error) {
    console.error(error);
    handleResponse(res, "An error occurred", 500, []);
  }
};

// create user
exports.createUser = async function (req, res) {
  const { name, email } = req.body;
  try {
    // First, check if a user with the given email already exists
    const emailCheckResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (emailCheckResult.rows.length > 0) {
      // If a user with this email was found, return an error or message
      handleResponse(res, "User with this email already exists", 400, []);
    } else {
      // If no user with this email exists, proceed with inserting the new user
      const newUser = await pool.query(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
        [name, email]
      );
      handleResponse(res, "User created successfully", 201, newUser.rows);
    }
  } catch (err) {
    handleResponse(res, "An error occurred", 500, []);
  }
};
// get all users
exports.getUsers = async function (req, res) {
  try {
    //  previus query
    // const allUsers = await pool.query("SELECT * FROM users ORDER BY id DESC");
    // new testing
    // Retrieve query parameters for filtering, sorting, and pagination
    const { filter, sortBy, sortOrder, page, pageSize } = req.query;

    // Set default values if not provided
    const currentPage = page || 1;
    const currentPageSize = pageSize || 10;
    const currentSortBy = sortBy || "id";
    const currentSortOrder = sortOrder === "asc" ? "asc" : "desc"; // default to descending if not 'asc'

    // Sanitize inputs (you should implement sanitization according to your context)
    // For example, check if the 'sortBy' field is valid for your table

    // Construct WHERE clause for filtering
    const whereClauses = [];
    if (filter) {
      // Assuming filter is in the format: field:value
      const filters = filter.split(",");
      filters.forEach((f) => {
        const [field, value] = f.split(":");
        // Add parameterized where clauses as needed
        // E.g., whereClauses.push(`${field} = $1`);
        // Make sure to sanitize and validate field and value
      });
    }

    // Calculate the offset
    const offset = (currentPage - 1) * currentPageSize;

    // Construct the SQL query
    const query = `
      SELECT * FROM users
      ${whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : ""}
      ORDER BY ${currentSortBy} ${currentSortOrder}
      LIMIT $1 OFFSET $2
    `;

    // http://localhost:3000/api/users?filter=email:vxsccdvvdsdcsdsf@ail.com,name:4zvasxdcvfgb&sortBy=created_at&sortOrder=desc&page=1&pageSize=4
    // Execute the query with pagination and sorting
    const allUsers = await pool.query(query, [currentPageSize, offset]);
    // check if allUsers.rows is empty
    if (allUsers.rows.length === 0) {
      handleResponse(res, "No users found", 404, []);
    } else {
      handleResponse(res, "Users retrieved successfully", 200, allUsers.rows);
    }
  } catch (err) {
    handleResponse(res, "An error occurred", 500, []);
  }
};
// get user
exports.getUser = async function (req, res) {
  const { id } = req.params;
  try {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    handleResponse(res, "User retrieved successfully", 200, user.rows);
  } catch (err) {
    handleResponse(res, "An error occurred", 500, []);
  }
};
// update user
exports.updateUser = async function (req, res) {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const updatedUser = await pool.query(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",
      [name, email, id]
    );
    handleResponse(res, "User updated successfully", 200, updatedUser.rows);
  } catch (err) {
    handleResponse(res, "An error occurred", 500, []);
  }
};
// delete user
exports.deleteUser = async function (req, res) {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    handleResponse(res, "User deleted successfully", 200, []);
  } catch (err) {
    handleResponse(res, "An error occurred", 500, []);
  }
};

//
exports.forgetPassword = async function (req, res) {
  const { email } = req.body;
  /// check if email exists
  const user = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (user.rows.length === 0) {
    return handleResponse(res, "No user found with this email", 404, []);
  } else {
    try {
      // generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      const htmlContent = `<span style="letter-spacing: 2px;font-size: 30px;padding:10">${verificationCode}</span>`;
      const info = await sendMail(
        res,
        "Verification Code for Password Reset",
        email,
        "",
        "",
        "You are receiving this because you (or someone else) have requested the reset of the password for your account.",
        "your verification code is :",
        "",
        "",
        htmlContent,
        "",
        "",
        "Not sure why you received this email?",
        "Thank you for using M TECHUB!"
      );
      handleResponse(res, "Email sent successfully", 200, {
        verificationCode: verificationCode,
      });
    } catch (error) {
      handleResponse(res, "An error occurred", 500, [error]);
    }
  }
};
