const { Router } = require("express");
const {
    purchaseOrder,
    updateVendorPOSendingStatus
} = require("../../controller/purchaseOrder/purchaseOrderController");

const router = Router();

router.route("/get/all").get(purchaseOrder);
router.route("/send/vendor/:id").post(updateVendorPOSendingStatus);

module.exports = router;
