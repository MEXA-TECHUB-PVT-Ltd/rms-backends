const { Router } = require("express");
const {
  createVendor,
  getVendor,
  getVendors,
  deleteVendor,
  updateVendor,
} = require("../../controller/Vendor/vendorController");
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
router.route("/").get(getVendors);
router.route("/:id").get(getVendor);
router.route("/:id").put(upload.single("document"), updateVendor);
router.route("/:id").delete(deleteVendor);

module.exports = router;
