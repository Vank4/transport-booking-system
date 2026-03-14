const crypto = require("crypto");
const Payment = require("../models/payments.model");
const Booking = require("../models/bookings.model");
const Seat = require("../models/seats.model");
const env = require("../config/env");

// --- Helper Functions ---
const getVNPayDate = (d) => {
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

function sortObject(obj) {
    let sorted = {};
    let str = [];
    for (let key in obj) { if (obj.hasOwnProperty(key)) { str.push(encodeURIComponent(key)); } }
    str.sort();
    for (let key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

// ─── KAN-220, 221, 222: Tạo URL VNPay ─────────────────
exports.createVnpayUrl = async (req, res) => {
    try {
        const { booking_id } = req.body;

        const booking = await Booking.findById(booking_id);
        if (!booking || (booking.status !== 'WAITING_PAYMENT' && booking.status !== 'PENDING')) {
            return res.status(400).json({ success: false, message: "Booking không hợp lệ hoặc đã qua thanh toán" });
        }

        // Tái sử dụng Payment PENDING nếu đã có
        let payment = await Payment.findOne({ booking_id: booking._id, status: 'PENDING' });
        if (!payment) {
            payment = await Payment.create({
                booking_id: booking._id,
                method: "VNPAY",
                amount: booking.total_amount,
                status: "PENDING"
            });
        } else if (payment.method !== 'VNPAY') {
            payment.method = 'VNPAY';
            await payment.save();
        }

        let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        let tmnCode = env.vnpTmnCode;
        let secretKey = env.vnpHashSecret;
        let vnpUrl = env.vnpUrl;
        let returnUrl = env.vnpReturnUrl;

        let date = new Date();
        let createDate = getVNPayDate(date);
        let expireDate = new Date(date.getTime() + 15 * 60000);
        let vnpExpireDate = getVNPayDate(expireDate);

        let vnp_Params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': tmnCode,
            'vnp_Locale': 'vn',
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': payment._id.toString(), // Dùng Object ID làm Mã Giao dịch vnp_TxnRef
            'vnp_OrderInfo': `Thanh toan don hang ${booking.booking_code}`,
            'vnp_OrderType': 'other',
            'vnp_Amount': booking.total_amount * 100,
            'vnp_ReturnUrl': returnUrl,
            'vnp_IpAddr': ipAddr,
            'vnp_CreateDate': createDate,
            'vnp_ExpireDate': vnpExpireDate
        };

        vnp_Params = sortObject(vnp_Params);

        const signData = Object.keys(vnp_Params).map(key => `${key}=${vnp_Params[key]}`).join('&');
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + Object.keys(vnp_Params).map(key => `${key}=${vnp_Params[key]}`).join('&');

        res.status(200).json({ success: true, url: vnpUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi tạo link thanh toán" });
    }
};

// ─── WEBHOOK GỐC CHUNG CHO MỌI CỔNG THANH TOÁN (Từ ổ D mang qua) ─────────────────
exports.paymentWebhook = async (req, res) => {
    try {
        const { transaction_id, status, gateway_payload } = req.body || {};

        if (!transaction_id || !status) {
            return res.status(400).json({ success: false, message: 'Missing transaction_id or status' });
        }

        // transaction_id truyền vào từ IPN chính là payment._id trong hệ thống của chúng ta
        let payment = await Payment.findById(transaction_id);
        if (!payment) {
            payment = await Payment.findOne({ transaction_id: transaction_id });
        }

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.status === 'SUCCESS' || payment.status === 'FAILED') {
            return res.status(200).json({ success: true, message: 'Already processed' });
        }

        payment.status = status;
        payment.gateway_response = gateway_payload || {};

        if (status === 'SUCCESS') {
            payment.paid_at = new Date();
            // Lấy mã giao dịch thực tế của VNPay (Bank Transaction ID) lưu lại
            if (gateway_payload && gateway_payload['vnp_TransactionNo']) {
                payment.transaction_id = gateway_payload['vnp_TransactionNo'];
            }
        }
        await payment.save();

        const booking = await Booking.findById(payment.booking_id);
        if (booking) {
            if (booking.status !== 'WAITING_PAYMENT' && booking.status !== 'PENDING') {
                return res.status(200).json({ success: true, message: 'Booking already confirmed or cancelled' });
            }

            if (status === 'SUCCESS') {
                booking.status = 'CONFIRMED';
                booking.total_amount = payment.amount;
                await booking.save();

                // Cập nhật Ghế (Seat) - Đặc quyền ổ C
                await Seat.updateMany(
                    { held_by_booking_id: booking._id },
                    { $set: { status: 'BOOKED' } }
                );

            } else if (status === 'FAILED') {
                booking.status = 'FAILED';
                await booking.save();

                // Hủy giữ Ghế (Seat) - Đặc quyền ổ C
                await Seat.updateMany(
                    { held_by_booking_id: booking._id },
                    { $set: { status: 'AVAILABLE', held_by_booking_id: null } }
                );
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send('Webhook Processing Error');
    }
};

// ─── VNPay Return URL (Frontend bắt lấy và Redirect) ─────────────────
exports.vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        const secretKey = env.vnpHashSecret;
        const signData = Object.keys(vnp_Params).map(key => `${key}=${vnp_Params[key]}`).join('&');
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const rspCode = vnp_Params['vnp_ResponseCode'];

            // Xử lý fallback Update (Bởi vì chạy localhost thì VNPay không thể bắn IPN trực tiếp về máy tính dev được)
            let paymentId = vnp_Params['vnp_TxnRef'];
            let paymentStatus = rspCode === '00' ? 'SUCCESS' : 'FAILED';

            try {
                const payment = await Payment.findById(paymentId);
                if (payment && payment.status === 'PENDING') {
                    const fakeReq = {
                        body: {
                            transaction_id: paymentId,
                            status: paymentStatus,
                            gateway_payload: vnp_Params
                        }
                    };
                    const fakeRes = {
                        status: () => ({ json: () => { }, send: () => { } })
                    };
                    await exports.paymentWebhook(fakeReq, fakeRes);
                }
            } catch (e) {
                console.error("Fallback Update Error:", e);
            }

            res.status(200).json({ success: true, message: 'Valid signature', code: rspCode });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature', code: '97' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error' });
    }
};

// ─── VNPay IPN (Server-to-Server) ─────────────────
exports.vnpayIpn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        let paymentId = vnp_Params['vnp_TxnRef'];
        let rspCode = vnp_Params['vnp_ResponseCode'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        const secretKey = env.vnpHashSecret;
        const signData = Object.keys(vnp_Params).map(key => `${key}=${vnp_Params[key]}`).join('&');
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const payment = await Payment.findById(paymentId);
            if (!payment) return res.status(200).json({ RspCode: '01', Message: 'Order not found' });

            if (payment.amount * 100 !== parseInt(vnp_Params['vnp_Amount'])) {
                return res.status(200).json({ RspCode: '04', Message: 'Amount invalid' });
            }

            if (payment.status === 'SUCCESS' || payment.status === 'FAILED') {
                return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
            }

            let status = rspCode === '00' ? 'SUCCESS' : 'FAILED';

            // Gọi hàm Webhook chung để xử lý DB Đồng bộ
            const fakeReq = {
                body: {
                    transaction_id: paymentId,
                    status: status,
                    gateway_payload: vnp_Params
                }
            };
            const fakeRes = {
                status: () => ({ json: () => { }, send: () => { } })
            };

            await exports.paymentWebhook(fakeReq, fakeRes);

            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
        }
    } catch (err) {
        console.error("VNPAY IPN LỖI:", err);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

// ─── MOCK THỬ NGHIỆM THANH TOÁN DÀNH CHO DEV ─────────────────
exports.mockConfirm = async (req, res) => {
    try {
        const { booking_id, status } = req.body;

        if (!booking_id || !status) {
            return res.status(400).json({ success: false, message: 'Missing booking_id or status' });
        }

        const payment = await Payment.findOne({ booking_id, status: 'PENDING' });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found or already processed' });
        }

        req.body = {
            transaction_id: payment._id.toString(),
            status,
            gateway_payload: { mock: true }
        };

        return exports.paymentWebhook(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ─── XEM STATUS THANH TOÁN ─────────────────
exports.getPaymentStatus = async (req, res) => {
    try {
        const payment = await Payment.findOne({ booking_id: req.params.bookingId }).sort({ createdAt: -1 });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Chưa có giao dịch thanh toán cho booking này' });
        }

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
