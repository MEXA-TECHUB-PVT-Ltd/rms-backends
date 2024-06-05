const { Router } = require("express");
const router = Router();
const currencyRoutes = require("./Vendor/Currency/currencyRoutes");
const unitRoutes = require("./Items/Units/unitRoutes");
const productCategoryRoutes = require("./Items/productCategory/productCategoryRoutes");
const paymentTermRoutes = require("./Vendor/PaymentTerms/paymentTermRoutes");
const vendorRoutes = require("./Vendor/vendorRoutes"); 
const itemRoutes = require("./Items/itemRoutes"); 
const fileUploadRoutes = require("./fileUpload/fileUploadRoutes");  
const categoryRoutes = require("./receipes/category/categoryRoutes"); 
const recipesRoutes = require("./receipes/recipesRoutes");  

router.use("/currency", currencyRoutes);
router.use("/payment-term", paymentTermRoutes);
router.use("/vendor", vendorRoutes);
router.use("/units", unitRoutes);
router.use("/product/category", productCategoryRoutes);
router.use("/item", itemRoutes);
router.use("/file", fileUploadRoutes);
router.use("/category", categoryRoutes);
router.use("/recipe", recipesRoutes);

module.exports = router;
