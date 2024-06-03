const { Router } = require("express");
const router = Router();
const currencyRoutes = require("./Vendor/Currency/currencyRoutes");
const paymentTermRoutes = require("./Vendor/PaymentTerms/paymentTermRoutes");
const vendorRoutes = require("./Vendor/vendorRoutes");

router.use("/currency", currencyRoutes);
router.use("/payment-term", paymentTermRoutes);
router.use("/vendor", vendorRoutes);

module.exports = router;
