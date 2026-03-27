const express = require("express");
const router = express.Router();
const vouchersController = require("../controllers/vouchers.controller");

router.get("/", vouchersController.getAllVouchers);
router.get("/:id", vouchersController.getVoucherById);
router.post("/", vouchersController.createVoucher);
router.put("/:id", vouchersController.updateVoucher);
router.delete("/:id", vouchersController.deleteVoucher);

module.exports = router;
