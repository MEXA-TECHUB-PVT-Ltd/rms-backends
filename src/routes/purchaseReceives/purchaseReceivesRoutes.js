const { Router } = require("express");
const {
    purchaseReceives
} = require("../../controller/PurchaseReceives/purchaseReceivesController");

const router = Router();

router.route("/create").post(purchaseReceives);

module.exports = router;
