const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Middleware kiểm tra JWT
const authMiddleware = (req, res, next) => {
	try {
		// Lấy token từ header Authorization: Bearer <token>
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				message: "Authorization token missing!",
			});
		}

		const token = authHeader.split(" ")[1];

		// Verify token bằng secret từ env config
		const decoded = jwt.verify(token, env.jwtSecret);

		// gắn thông tin user vào request
		req.user = decoded;

		next();
	} catch (err) {
		return res.status(401).json({
			message: "Invalid or expired token!",
		});
	}
};

module.exports = authMiddleware;
