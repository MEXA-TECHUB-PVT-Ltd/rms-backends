const { Router } = require("express");
const router = Router();
const currencyRoutes = require("./Vendor/Currency/currencyRoutes");
const unitRoutes = require("./Items/Units/unitRoutes");
const productCategoryRoutes = require("./Items/productCategory/productCategoryRoutes");
const paymentTermRoutes = require("./Vendor/PaymentTerms/paymentTermRoutes");
const vendorRoutes = require("./Vendor/vendorRoutes");

router.use("/currency", currencyRoutes);
router.use("/payment-term", paymentTermRoutes);
router.use("/vendor", vendorRoutes);
router.use("/units", unitRoutes);
router.use("/product/category", productCategoryRoutes);

module.exports = router;
