const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  date_of_birth: { type: Date, default: null },
  gender: { type: String, enum: ["Nam", "Nữ", "Khác"], default: null },
  nationality: {
    code: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  id_card: { type: String, default: "" },
  passport: { type: String, default: "" },
  avatar_url: { type: String, default: "" },
  address: {
    country_code: { type: String, default: "" },
    country_name: { type: String, default: "" },
    city: { type: String, default: "" },
    district: { type: String, default: "" },
    address_detail: { type: String, default: "" },
    full_address: { type: String, default: "" },
  },
  preferences: {
    security: {
      two_factor_enabled: { type: Boolean, default: false },
      login_alerts: { type: Boolean, default: true },
      backup_email: { type: String, default: "" },
    },
    notifications: {
      booking_email: { type: Boolean, default: true },
      booking_sms: { type: Boolean, default: true },
      push_updates: { type: Boolean, default: true },
      promo_email: { type: Boolean, default: false },
      promo_sms: { type: Boolean, default: false },
      weekly_summary: { type: Boolean, default: true },
      reminder_time: { type: String, default: "08:00" },
      contact_email: { type: String, default: "" },
      contact_phone: { type: String, default: "" },
    },
    terms: {
      agree_terms: { type: Boolean, default: false },
      agree_privacy: { type: Boolean, default: false },
      agree_data: { type: Boolean, default: false },
      feedback: { type: String, default: "" },
    },
    settings: {
      language: { type: String, default: "vi" },
      theme: { type: String, default: "light" },
      currency: { type: String, default: "VND" },
      timezone: { type: String, default: "GMT+7" },
      seat_preference: { type: String, default: "window" },
      auto_apply_voucher: { type: Boolean, default: true },
      compact_view: { type: Boolean, default: false },
    },
  },
  trusted_devices: [
    {
      name: { type: String, default: "" },
      location: { type: String, default: "" },
      last_active: { type: Date, default: Date.now },
      created_at: { type: Date, default: Date.now },
    },
  ],
  password_hash: { type: String, required: true },
  role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
  status: { type: String, enum: ["ACTIVE", "BLOCKED"], default: "ACTIVE" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
