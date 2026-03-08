const mongoose = require("mongoose");

const passwordResetTokenSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		otp_hash: {
			type: String,
			required: true,
		},
		expires_at: {
			type: Date,
			required: true,
			index: { expireAfterSeconds: 0 }, // MongoDB TTL: tự xóa khi hết hạn
		},
		used: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: { createdAt: "created_at", updatedAt: false } },
);

const PasswordResetToken = mongoose.model(
	"PasswordResetToken",
	passwordResetTokenSchema,
);

module.exports = PasswordResetToken;
