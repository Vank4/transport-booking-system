const User = require("../models/users.model");
const { verifyAccessToken } = require("../services/token.service");
const AppError = require("../utils/appError");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return next(new AppError("Unauthorized", 401));
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("-password_hash");
    if (!user || !user.status === "ACTIVE") {
      return next(new AppError("Unauthorized", 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError("Unauthorized", 401));
  }
}

module.exports = {
  authenticate,
};
