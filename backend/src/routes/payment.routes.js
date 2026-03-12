const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// D-based routes migration:
router.post('/mock-confirm', paymentController.mockConfirm);
router.post('/webhook', paymentController.paymentWebhook);
router.get('/:bookingId/status', paymentController.getPaymentStatus);

// API Tạo link VNPay (Frontend gọi lúc nhấn nút Thanh Toán)
router.post('/create', paymentController.createVnpayUrl);

// API VNPay Frontend Return
router.get('/vnpay_return', paymentController.vnpayReturn);

// API VNPay Server-to-Server IPN
router.get('/vnpay_ipn', paymentController.vnpayIpn);

module.exports = router;
