const { Router } = require("express");
const router = Router();
const currencyRoutes = require("./Vendor/Currency/currencyRoutes");

router.use("/currency", currencyRoutes);

module.exports = router;
