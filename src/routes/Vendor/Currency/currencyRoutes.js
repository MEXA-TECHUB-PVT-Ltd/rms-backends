const { Router } = require("express");
const {
  createCurrency,
} = require("../../../controller/Vendor/Currency/currencyController");

const router = Router();

router.route("/create").post(createCurrency);

module.exports = router;
