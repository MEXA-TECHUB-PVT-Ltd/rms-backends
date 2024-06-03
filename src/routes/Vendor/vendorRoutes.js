const { Router } = require("express");
const { createVendor } = require("../../controller/Vendor/vendorController");
const {
  validateBody,
} = require("../../middleware/validations/validationMiddleware");
const vendorSchema = require("../../validation/vendorValidation");
const upload = require("../../middleware/multer");

const router = Router();

router
  .route("/create")
  .post(
    upload.single("document"),
    validateBody(vendorSchema.createVendor),
    createVendor
  );

module.exports = router;
