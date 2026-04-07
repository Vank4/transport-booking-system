const express = require("express");
const router = express.Router();
const vouchersController = require("../controllers/vouchers.controller");

const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

router.get("/", vouchersController.getAllVouchers);
router.get("/:id", vouchersController.getVoucherById);
router.post("/", authMiddleware, authorizeRoles("ADMIN"), vouchersController.createVoucher);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), vouchersController.updateVoucher);
router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), vouchersController.deleteVoucher);

module.exports = router;
