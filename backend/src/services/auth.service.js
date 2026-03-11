const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/users.model");
const PasswordResetToken = require("../models/passwordResetToken.model");
const { sendPasswordResetEmail } = require("../utils/email.service");
const env = require("../config/env");

// ─── Custom error class for domain errors ─────────────────────────────────────
class AuthServiceError extends Error {
	constructor(message, statusCode = 400) {
		super(message);
		this.name = "AuthServiceError";
		this.statusCode = statusCode;
	}
}

// ─── registerUser ─────────────────────────────────────────────────────────────
async function registerUser({ full_name, email, phone, password }) {
	const userExists = await User.findOne({ email });
	if (userExists) {
		throw new AuthServiceError("Email already exists.", 400);
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const user = new User({
		full_name,
		email,
		phone,
		password_hash: hashedPassword,
		role: "USER",
		status: "ACTIVE",
		created_at: new Date(),
	});

	await user.save();
	return { message: "User registered successfully." };
}

// ─── loginUser ────────────────────────────────────────────────────────────────
async function loginUser({ email, password }) {
	const user = await User.findOne({ email });
	if (!user) throw new AuthServiceError("User not found.", 400);

	const match = await bcrypt.compare(password, user.password_hash);
	if (!match) throw new AuthServiceError("Invalid password.", 400);

	const token = jwt.sign({ userId: user._id }, env.jwtSecret, {
		expiresIn: "1h",
	});

	return { message: "Login successful.", token };
}

// ─── forgotPassword ───────────────────────────────────────────────────────────
async function forgotPassword({ email }) {
	if (!email) throw new AuthServiceError("Email is required.", 400);

	const user = await User.findOne({ email });

	// Generate OTP regardless of whether user exists (security best practice)
	const otp = String(crypto.randomInt(100000, 1000000));
	const otpHash = await bcrypt.hash(otp, 10);

	if (user) {
		await PasswordResetToken.deleteMany({ user_id: user._id });

		const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
		await PasswordResetToken.create({
			user_id: user._id,
			otp_hash: otpHash,
			expires_at: expiresAt,
			used: false,
		});

		try {
			await sendPasswordResetEmail(user.email, otp);
		} catch (err) {
			console.error("[forgotPassword] Email send failed:", err);
			await PasswordResetToken.deleteMany({ user_id: user._id });
			throw new AuthServiceError(
				"Failed to send OTP email. Please try again later.",
				500,
			);
		}
	}

	return {
		message:
			"If an account is found, an OTP has been sent to the email address associated with this account.",
	};
}

// ─── resetPassword ────────────────────────────────────────────────────────────
async function resetPassword({ email, otp, new_password, confirm_password }) {
	if (!otp || !new_password || !confirm_password) {
		throw new AuthServiceError(
			"OTP, new password, and confirm password are required.",
			400,
		);
	}

	if (new_password !== confirm_password) {
		throw new AuthServiceError("Passwords do not match.", 400);
	}

	const user = await User.findOne({ email });
	if (!user) throw new AuthServiceError("Account not found.", 404);

	const tokenRecord = await PasswordResetToken.findOne({
		user_id: user._id,
		used: false,
		expires_at: { $gt: new Date() },
	});

	if (!tokenRecord) {
		throw new AuthServiceError("Invalid or expired OTP.", 400);
	}

	const isOtpValid = await bcrypt.compare(otp, tokenRecord.otp_hash);
	if (!isOtpValid) throw new AuthServiceError("Invalid or expired OTP.", 400);

	const newPasswordHash = await bcrypt.hash(new_password, 10);

	await User.updateOne(
		{ _id: user._id },
		{ password_hash: newPasswordHash, updated_at: new Date() },
	);

	await PasswordResetToken.updateOne({ _id: tokenRecord._id }, { used: true });

	return { message: "Password reset successfully." };
}

module.exports = {
	AuthServiceError,
	registerUser,
	loginUser,
	forgotPassword,
	resetPassword,
};
