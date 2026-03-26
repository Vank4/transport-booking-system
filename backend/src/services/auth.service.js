const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs/promises");
const path = require("path");

const User = require("../models/users.model");
const Booking = require("../models/bookings.model");
const PasswordResetToken = require("../models/passwordResetToken.model");

const { sendPasswordResetEmail } = require("../utils/email.service");
const env = require("../config/env");

const AVATAR_RELATIVE_DIR = "/images/avatar";
const AVATAR_STORAGE_DIR = path.join(
  __dirname,
  "../../../frontend/public/images/avatar",
);

// ─────────────────────────────────────────
// Custom Error
// ─────────────────────────────────────────
class AuthServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AuthServiceError";
    this.statusCode = statusCode;
  }
}

// ─────────────────────────────────────────
// REGISTER (KAN-7)
// ─────────────────────────────────────────
async function registerUser({ full_name, email, phone, password }) {
  if (!full_name || !email || !password) {
    throw new AuthServiceError("Missing required fields.", 400);
  }

  if (password.length < 6) {
    throw new AuthServiceError("Password must be at least 6 characters.", 400);
  }

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

// ─────────────────────────────────────────
// LOGIN (KAN-6)
// ─────────────────────────────────────────
async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new AuthServiceError("Email and password are required.", 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AuthServiceError("User not found.", 404);
  }

  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    throw new AuthServiceError("Invalid password.", 400);
  }

  const accessToken = jwt.sign({ userId: user._id }, env.jwtSecret, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign({ userId: user._id }, env.jwtRefreshSecret, {
    expiresIn: "7d",
  });

  return {
    message: "Login successful.",
    accessToken,
    refreshToken,
  };
}

// ─────────────────────────────────────────
// REFRESH TOKEN (KAN-8)
// ─────────────────────────────────────────
async function refreshToken({ refreshToken }) {
  if (!refreshToken) {
    throw new AuthServiceError("Refresh token required.", 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);

    const accessToken = jwt.sign({ userId: decoded.userId }, env.jwtSecret, {
      expiresIn: "1h",
    });

    return { accessToken };
  } catch (err) {
    throw new AuthServiceError("Invalid refresh token.", 401);
  }
}

// ─────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────
async function forgotPassword({ email }) {
  if (!email) throw new AuthServiceError("Email is required.", 400);

  const user = await User.findOne({ email });

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

// ─────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────
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

  if (!user) {
    throw new AuthServiceError("Account not found.", 404);
  }

  const tokenRecord = await PasswordResetToken.findOne({
    user_id: user._id,
    used: false,
    expires_at: { $gt: new Date() },
  });

  if (!tokenRecord) {
    throw new AuthServiceError("Invalid or expired OTP.", 400);
  }

  const isOtpValid = await bcrypt.compare(otp, tokenRecord.otp_hash);

  if (!isOtpValid) {
    throw new AuthServiceError("Invalid or expired OTP.", 400);
  }

  const newPasswordHash = await bcrypt.hash(new_password, 10);

  await User.updateOne(
    { _id: user._id },
    {
      password_hash: newPasswordHash,
      updated_at: new Date(),
    },
  );

  await PasswordResetToken.updateOne({ _id: tokenRecord._id }, { used: true });

  return { message: "Password reset successfully." };
}

// ─────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────
async function getProfile(userId) {
  const user = await User.findById(userId).select("-password_hash -__v");

  if (!user) {
    throw new AuthServiceError("User not found.", 404);
  }

  return user;
}

function normalizeBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  return Boolean(value);
}

function normalizeTimeString(value, defaultValue = "08:00") {
  const raw = normalizeOptionalString(value);
  if (!raw) return defaultValue;
  if (!/^\d{2}:\d{2}$/.test(raw)) return defaultValue;
  return raw;
}

function toIsoStringOrNow(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function mapTrustedDevice(device) {
  return {
    id: String(device?._id ?? ""),
    name: normalizeOptionalString(device?.name),
    location: normalizeOptionalString(device?.location),
    last_active: toIsoStringOrNow(device?.last_active),
  };
}

function buildProfilePreferences(user) {
  const fallbackEmail = normalizeOptionalString(user?.email);
  const fallbackPhone = normalizeOptionalString(user?.phone);

  const security = {
    two_factor_enabled: normalizeBoolean(
      user?.preferences?.security?.two_factor_enabled,
      false,
    ),
    login_alerts: normalizeBoolean(user?.preferences?.security?.login_alerts, true),
    backup_email:
      normalizeOptionalString(user?.preferences?.security?.backup_email) ||
      fallbackEmail,
  };

  const notifications = {
    booking_email: normalizeBoolean(
      user?.preferences?.notifications?.booking_email,
      true,
    ),
    booking_sms: normalizeBoolean(user?.preferences?.notifications?.booking_sms, true),
    push_updates: normalizeBoolean(
      user?.preferences?.notifications?.push_updates,
      true,
    ),
    promo_email: normalizeBoolean(
      user?.preferences?.notifications?.promo_email,
      false,
    ),
    promo_sms: normalizeBoolean(user?.preferences?.notifications?.promo_sms, false),
    weekly_summary: normalizeBoolean(
      user?.preferences?.notifications?.weekly_summary,
      true,
    ),
    reminder_time: normalizeTimeString(
      user?.preferences?.notifications?.reminder_time,
      "08:00",
    ),
    contact_email:
      normalizeOptionalString(user?.preferences?.notifications?.contact_email) ||
      fallbackEmail,
    contact_phone:
      normalizeOptionalString(user?.preferences?.notifications?.contact_phone) ||
      fallbackPhone,
  };

  const terms = {
    agree_terms: normalizeBoolean(user?.preferences?.terms?.agree_terms, false),
    agree_privacy: normalizeBoolean(user?.preferences?.terms?.agree_privacy, false),
    agree_data: normalizeBoolean(user?.preferences?.terms?.agree_data, false),
    feedback: normalizeOptionalString(user?.preferences?.terms?.feedback),
  };

  const settings = {
    language: normalizeOptionalString(user?.preferences?.settings?.language) || "vi",
    theme: normalizeOptionalString(user?.preferences?.settings?.theme) || "light",
    currency: normalizeOptionalString(user?.preferences?.settings?.currency) || "VND",
    timezone:
      normalizeOptionalString(user?.preferences?.settings?.timezone) || "GMT+7",
    seat_preference:
      normalizeOptionalString(user?.preferences?.settings?.seat_preference) ||
      "window",
    auto_apply_voucher: normalizeBoolean(
      user?.preferences?.settings?.auto_apply_voucher,
      true,
    ),
    compact_view: normalizeBoolean(user?.preferences?.settings?.compact_view, false),
  };

  const trustedDevices = Array.isArray(user?.trusted_devices)
    ? user.trusted_devices.map(mapTrustedDevice).filter((item) => item.id)
    : [];

  return {
    security,
    notifications,
    terms,
    settings,
    trusted_devices: trustedDevices,
  };
}

async function getProfilePreferences(userId) {
  const user = await User.findById(userId).select(
    "email phone preferences trusted_devices",
  );

  if (!user) {
    throw new AuthServiceError("User not found.", 404);
  }

  return buildProfilePreferences(user);
}

function normalizeTrustedDevices(devices) {
  if (!Array.isArray(devices)) {
    throw new AuthServiceError("trusted_devices must be an array.", 400);
  }

  return devices.map((item) => ({
    ...(() => {
      const parsed = item?.last_active ? new Date(item.last_active) : new Date();
      return {
        last_active: Number.isNaN(parsed.getTime()) ? new Date() : parsed,
      };
    })(),
    name: normalizeOptionalString(item?.name),
    location: normalizeOptionalString(item?.location),
    created_at: new Date(),
  }));
}

async function updateProfilePreferences(userId, payload = {}) {
  const user = await User.findById(userId).select(
    "email phone preferences trusted_devices password_hash",
  );
  if (!user) {
    throw new AuthServiceError("User not found.", 404);
  }

  const nextPreferences = buildProfilePreferences(user);

  if (payload.security !== undefined) {
    nextPreferences.security = {
      ...nextPreferences.security,
      two_factor_enabled: normalizeBoolean(
        payload.security?.two_factor_enabled,
        nextPreferences.security.two_factor_enabled,
      ),
      login_alerts: normalizeBoolean(
        payload.security?.login_alerts,
        nextPreferences.security.login_alerts,
      ),
      backup_email:
        normalizeOptionalString(payload.security?.backup_email) ||
        nextPreferences.security.backup_email,
    };
  }

  if (payload.notifications !== undefined) {
    nextPreferences.notifications = {
      ...nextPreferences.notifications,
      booking_email: normalizeBoolean(
        payload.notifications?.booking_email,
        nextPreferences.notifications.booking_email,
      ),
      booking_sms: normalizeBoolean(
        payload.notifications?.booking_sms,
        nextPreferences.notifications.booking_sms,
      ),
      push_updates: normalizeBoolean(
        payload.notifications?.push_updates,
        nextPreferences.notifications.push_updates,
      ),
      promo_email: normalizeBoolean(
        payload.notifications?.promo_email,
        nextPreferences.notifications.promo_email,
      ),
      promo_sms: normalizeBoolean(
        payload.notifications?.promo_sms,
        nextPreferences.notifications.promo_sms,
      ),
      weekly_summary: normalizeBoolean(
        payload.notifications?.weekly_summary,
        nextPreferences.notifications.weekly_summary,
      ),
      reminder_time: normalizeTimeString(
        payload.notifications?.reminder_time,
        nextPreferences.notifications.reminder_time,
      ),
      contact_email:
        normalizeOptionalString(payload.notifications?.contact_email) ||
        nextPreferences.notifications.contact_email,
      contact_phone:
        normalizeOptionalString(payload.notifications?.contact_phone) ||
        nextPreferences.notifications.contact_phone,
    };
  }

  if (payload.terms !== undefined) {
    nextPreferences.terms = {
      ...nextPreferences.terms,
      agree_terms: normalizeBoolean(
        payload.terms?.agree_terms,
        nextPreferences.terms.agree_terms,
      ),
      agree_privacy: normalizeBoolean(
        payload.terms?.agree_privacy,
        nextPreferences.terms.agree_privacy,
      ),
      agree_data: normalizeBoolean(
        payload.terms?.agree_data,
        nextPreferences.terms.agree_data,
      ),
      feedback:
        normalizeOptionalString(payload.terms?.feedback) ||
        nextPreferences.terms.feedback,
    };
  }

  if (payload.settings !== undefined) {
    nextPreferences.settings = {
      ...nextPreferences.settings,
      language:
        normalizeOptionalString(payload.settings?.language) ||
        nextPreferences.settings.language,
      theme:
        normalizeOptionalString(payload.settings?.theme) ||
        nextPreferences.settings.theme,
      currency:
        normalizeOptionalString(payload.settings?.currency) ||
        nextPreferences.settings.currency,
      timezone:
        normalizeOptionalString(payload.settings?.timezone) ||
        nextPreferences.settings.timezone,
      seat_preference:
        normalizeOptionalString(payload.settings?.seat_preference) ||
        nextPreferences.settings.seat_preference,
      auto_apply_voucher: normalizeBoolean(
        payload.settings?.auto_apply_voucher,
        nextPreferences.settings.auto_apply_voucher,
      ),
      compact_view: normalizeBoolean(
        payload.settings?.compact_view,
        nextPreferences.settings.compact_view,
      ),
    };
  }

  const updateData = {
    preferences: {
      security: nextPreferences.security,
      notifications: nextPreferences.notifications,
      terms: nextPreferences.terms,
      settings: nextPreferences.settings,
    },
    updated_at: new Date(),
  };

  if (payload.trusted_devices !== undefined) {
    updateData.trusted_devices = normalizeTrustedDevices(payload.trusted_devices);
  }

  await User.updateOne({ _id: userId }, updateData);

  const refreshed = await User.findById(userId).select(
    "email phone preferences trusted_devices",
  );
  if (!refreshed) {
    throw new AuthServiceError("User not found.", 404);
  }

  return buildProfilePreferences(refreshed);
}

// ─────────────────────────────────────────
// UPDATE PROFILE (KAN-26)
// ─────────────────────────────────────────
function normalizeString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeOptionalString(value) {
  if (value === null || value === undefined) return "";
  return normalizeString(value);
}

function normalizeDateOfBirth(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AuthServiceError("Invalid date_of_birth value.", 400);
  }
  return parsed;
}

function normalizeGender(value) {
  if (value === null || value === undefined || value === "") return null;
  const raw = normalizeString(value);
  const allowed = new Set(["Nam", "Nữ", "Khác", "Ná»¯", "KhĂ¡c"]);
  if (!allowed.has(raw)) {
    throw new AuthServiceError("Invalid gender value.", 400);
  }
  if (raw === "Ná»¯") return "Nữ";
  if (raw === "KhĂ¡c") return "Khác";
  return raw;
}

function buildFullAddress({
  addressDetail,
  district,
  city,
  countryName,
}) {
  return [addressDetail, district, city, countryName]
    .map((item) => normalizeOptionalString(item))
    .filter(Boolean)
    .join(", ");
}

function getAvatarFilePath(avatarUrl) {
  if (typeof avatarUrl !== "string") return null;
  if (!avatarUrl.startsWith(`${AVATAR_RELATIVE_DIR}/`)) return null;
  const fileName = avatarUrl.slice(`${AVATAR_RELATIVE_DIR}/`.length);
  if (!fileName || fileName.includes("/") || fileName.includes("\\")) return null;
  return path.join(AVATAR_STORAGE_DIR, fileName);
}

async function saveAvatarFromDataUrl(avatarBase64) {
  if (typeof avatarBase64 !== "string" || !avatarBase64.trim()) {
    return null;
  }

  const matched = avatarBase64.match(
    /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/i,
  );

  if (!matched) {
    throw new AuthServiceError("Invalid avatar format. Use PNG or JPG data URL.", 400);
  }

  const mimeType = matched[1].toLowerCase();
  const base64Data = matched[2];
  const buffer = Buffer.from(base64Data, "base64");

  if (!buffer.length) {
    throw new AuthServiceError("Avatar image is empty.", 400);
  }

  const maxBytes = 2 * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw new AuthServiceError("Avatar image must be 2MB or less.", 400);
  }

  const ext = mimeType === "image/png" ? "png" : "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const fullPath = path.join(AVATAR_STORAGE_DIR, fileName);

  await fs.mkdir(AVATAR_STORAGE_DIR, { recursive: true });
  await fs.writeFile(fullPath, buffer);

  return {
    avatarUrl: `${AVATAR_RELATIVE_DIR}/${fileName}`,
    fullPath,
  };
}

async function updateProfile(
  userId,
  {
    full_name,
    phone,
    date_of_birth,
    gender,
    nationality,
    id_card,
    passport,
    avatar_url,
    avatar_base64,
    address,
  },
) {
  const existingUser = await User.findById(userId).select("avatar_url");
  if (!existingUser) {
    throw new AuthServiceError("User not found.", 404);
  }

  const updateData = {
    updated_at: new Date(),
  };
  let newAvatarPath = null;

  if (full_name !== undefined) {
    updateData.full_name = normalizeString(full_name);
  }

  if (phone !== undefined) {
    updateData.phone = normalizeOptionalString(phone);
  }

  if (date_of_birth !== undefined) {
    updateData.date_of_birth = normalizeDateOfBirth(date_of_birth);
  }

  if (gender !== undefined) {
    updateData.gender = normalizeGender(gender);
  }

  if (id_card !== undefined) {
    updateData.id_card = normalizeOptionalString(id_card);
  }

  if (passport !== undefined) {
    updateData.passport = normalizeOptionalString(passport);
  }

  if (avatar_url !== undefined) {
    updateData.avatar_url = normalizeOptionalString(avatar_url);
  }

  if (avatar_base64 !== undefined) {
    const savedAvatar = await saveAvatarFromDataUrl(avatar_base64);
    if (savedAvatar?.avatarUrl) {
      updateData.avatar_url = savedAvatar.avatarUrl;
      newAvatarPath = savedAvatar.fullPath;
    }
  }

  if (nationality !== undefined) {
    updateData.nationality = {
      code: normalizeOptionalString(nationality?.code),
      name: normalizeOptionalString(nationality?.name),
    };
  }

  if (address !== undefined) {
    const countryName = normalizeOptionalString(address?.country_name);
    const city = normalizeOptionalString(address?.city);
    const district = normalizeOptionalString(address?.district);
    const addressDetail = normalizeOptionalString(address?.address_detail);

    updateData.address = {
      country_code: normalizeOptionalString(address?.country_code),
      country_name: countryName,
      city,
      district,
      address_detail: addressDetail,
      full_address: buildFullAddress({
        addressDetail,
        district,
        city,
        countryName,
      }),
    };
  }

  try {
    await User.updateOne({ _id: userId }, updateData);
  } catch (error) {
    if (newAvatarPath) {
      await fs.unlink(newAvatarPath).catch(() => {});
    }
    throw error;
  }

  const previousAvatarPath = getAvatarFilePath(existingUser.avatar_url);
  const currentAvatarPath = getAvatarFilePath(updateData.avatar_url);
  if (previousAvatarPath && previousAvatarPath !== currentAvatarPath) {
    await fs.unlink(previousAvatarPath).catch(() => {});
  }

  const user = await User.findById(userId).select("-password_hash -__v");
  if (!user) {
    throw new AuthServiceError("User not found.", 404);
  }

  return {
    message: "Profile updated successfully.",
    data: user,
  };
}

// ─────────────────────────────────────────
// MY BOOKINGS (KAN-32)
// ─────────────────────────────────────────
async function myBookings(userId) {
  const bookings = await Booking.find({ user_id: userId });

  return bookings;
}

// ─────────────────────────────────────────
// CHANGE PASSWORD (KAN-38)
// ─────────────────────────────────────────
async function changePassword(userId, { oldPassword, newPassword }) {
  if (!oldPassword || !newPassword) {
    throw new AuthServiceError(
      "Old password and new password are required.",
      400,
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AuthServiceError("User not found.", 404);
  }

  const match = await bcrypt.compare(oldPassword, user.password_hash);

  if (!match) {
    throw new AuthServiceError("Old password is incorrect.", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.updateOne(
    { _id: userId },
    {
      password_hash: hashedPassword,
      updated_at: new Date(),
    },
  );

  return { message: "Password changed successfully." };
}

module.exports = {
  AuthServiceError,
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  getProfilePreferences,
  updateProfile,
  updateProfilePreferences,
  myBookings,
  changePassword,
};
