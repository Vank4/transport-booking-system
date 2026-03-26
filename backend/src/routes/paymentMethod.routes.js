const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const paymentMethodController = require("../controllers/paymentMethod.controller");

router.use(authMiddleware);

router.get("/", paymentMethodController.listPaymentMethods);
router.post("/", paymentMethodController.createPaymentMethod);
router.patch("/:id/default", paymentMethodController.setDefaultPaymentMethod);
router.delete("/:id", paymentMethodController.deletePaymentMethod);

module.exports = router;
