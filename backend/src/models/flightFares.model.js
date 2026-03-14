const mongoose = require("mongoose");

/**
 * FlightFare — Bảng giá hạng vé máy bay theo từng chuyến bay.
 *
 * Công thức tính giá cuối của 1 vé:
 *   final_price = (promo_price ?? base_price) + seat.price_modifier
 */
const flightFareSchema = new mongoose.Schema(
  {
    // Chuyến bay áp dụng bảng giá này
    flight_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      required: true,
      index: true,
    },

    // Hạng khoang (ánh xạ với Seat.class)
    cabin_class: {
      type: String,
      enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST_CLASS"],
      required: true,
    },

    // Tên thương mại của hạng vé (vd: "Eco Lite", "Flex Saver", "Business Full Flex")
    fare_name: {
      type: String,
      required: true,
      trim: true,
    },

    // ─── GIÁ VÉ ───────────────────────────────────────────────────────────────
    // Giá gốc niêm yết (VNĐ)
    base_price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Giá khuyến mãi — null nếu không có sale
    promo_price: {
      type: Number,
      default: null,
      min: 0,
    },

    // ─── HÀNH LÝ ──────────────────────────────────────────────────────────────
    // Hành lý ký gửi miễn phí (kg), 0 = không kèm
    baggage_kg: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Hành lý xách tay (kg)
    carry_on_kg: {
      type: Number,
      default: 7,
      min: 0,
    },

    // ─── CHÍNH SÁCH ───────────────────────────────────────────────────────────
    // Có được hoàn vé không?
    is_refundable: {
      type: Boolean,
      default: false,
    },

    // Phí đổi vé (VNĐ), 0 = miễn phí đổi
    change_fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── KIỂM SOÁT HIỂN THỊ ───────────────────────────────────────────────────
    // Số ghế hiển thị còn trống ở hạng này (dùng để báo "Còn X chỗ" cho FE)
    available_seats: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Bật/tắt hiển thị hạng vé — tắt khi hết chỗ hoặc dừng bán
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Index tổng hợp đảm bảo 1 chuyến bay không trùng (cabin_class + fare_name)
flightFareSchema.index({ flight_id: 1, cabin_class: 1, fare_name: 1 }, { unique: true });

/**
 * Helper: trả về giá hiệu dụng (promo nếu có, ngược lại base_price)
 */
flightFareSchema.virtual("effective_price").get(function () {
  return this.promo_price != null ? this.promo_price : this.base_price;
});

const FlightFare = mongoose.model("FlightFare", flightFareSchema);
module.exports = FlightFare;
