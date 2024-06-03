const { Router } = require("express");
const router = Router();
const currencyRoutes = require("./Vendor/Currency/currencyRoutes");
const unitRoutes = require("./Items/Units/unitRoutes");
const productCategoryRoutes = require("./Items/productCategory/productCategoryRoutes");

router.use("/currency", currencyRoutes);
router.use("/units", unitRoutes);
router.use("/product/category", productCategoryRoutes);

module.exports = router;
