const { Router } = require("express");
const {
    purchaseOrder,
    updateVendorPOSendingStatus,
    purchaseOrderv2,
    getPurchaseOrderDetails
} = require("../../controller/PurchaseOrder/purchaseOrderController");

const router = Router();

router.route("/get/all").get(purchaseOrder);
router.route("/send/vendor").put(updateVendorPOSendingStatus);
router.route("/get/purchase/order").get(purchaseOrderv2);
router.route("/get").get(getPurchaseOrderDetails);

module.exports = router;
