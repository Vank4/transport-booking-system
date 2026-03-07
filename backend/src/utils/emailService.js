const nodemailer = require("nodemailer");
const env = require("../config/env");

/**
 * Tạo transporter mới mỗi lần gửi để đảm bảo dùng giá trị env hiện tại.
 * (Tránh lỗi khi module được load trước khi dotenv đọc xong)
 */
const createTransporter = () =>
	nodemailer.createTransport({
		host: env.smtpHost,
		port: env.smtpPort,
		secure: env.smtpPort === 465,
		auth: {
			user: env.smtpUser,
			pass: env.smtpPass,
		},
	});

/**
 * Gửi email chứa OTP reset mật khẩu.
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} otp - Mã OTP 6 chữ số
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (to, otp) => {
	const expiryMinutes = env.otpExpiryMinutes;

	// Dùng smtpUser làm địa chỉ gửi để khớp tài khoản xác thực SMTP
	const fromAddress = env.emailFrom || env.smtpUser;

	const transporter = createTransporter();

	const mailOptions = {
		from: {
			name: "Transport Booking",
			address: fromAddress,
		},
		to,
		subject: "Yêu cầu đặt lại mật khẩu",
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2 style="color: #2563eb;">Đặt lại mật khẩu</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Mã OTP của bạn là:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af; margin: 16px 0;">
          ${otp}
        </div>
        <p>Mã này có hiệu lực trong <strong>${expiryMinutes} phút</strong>.</p>
        <p style="color: #6b7280; font-size: 13px;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
        </p>
      </div>
    `,
	};

	await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };
