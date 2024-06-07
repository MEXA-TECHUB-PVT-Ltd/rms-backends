const { Router } = require("express");
const {
    purchaseReceives
} = require("../../controller/purchaseReceives/purchaseReceivesController");

const router = Router();

router.route("/create").post(purchaseReceives);

module.exports = router;
