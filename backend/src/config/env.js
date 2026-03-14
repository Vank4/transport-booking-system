require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT || 3000),

  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27017/transport_booking",

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  jwtRefreshSecret: process.env.JWT_SECRET || "dev_secret_change_me",

  seatHoldTtlMinutes: Number(process.env.SEAT_HOLD_TTL_MINUTES || 15),

  // Email / SMTP config
  smtpHost: process.env.SMTP_HOST || "smtp.ethereal.email",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  emailFrom: process.env.EMAIL_FROM || "no-reply@transport-booking.com",

	// OTP config
	otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 15),

	// VNPAY
	vnpTmnCode: process.env.VNP_TMN_CODE || "",
	vnpHashSecret: process.env.VNP_HASH_SECRET || "",
	vnpUrl: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
	vnpReturnUrl: process.env.VNP_RETURN_URL || "http://localhost:5173/payment-success",
};

module.exports = env;   
