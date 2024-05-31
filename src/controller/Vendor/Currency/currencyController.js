const pool = require("../../../config/db");
const { responseSender } = require("../../../utilities/responseHandlers");

const createCurrency = async (req, res, next) => {
  const { currency } = req.body;

  if (!currency) {
    return responseSender(res, 422, false, "currency is required");
  }

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO currency (ccy) VALUES ($1) RETURNING *`,
      [currency.toUpperCase()]
    );

    if (rowCount === 0) {
      return responseSender(res, 400, false, "Currency Not Added");
    }

    return responseSender(res, 201, true, "Currency Added", rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCurrency,
};
