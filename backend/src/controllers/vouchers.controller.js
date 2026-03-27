const Voucher = require("../models/vouchers.model");

// GET /api/vouchers
exports.getAllVouchers = async (req, res) => {
  try {
    const { page = 1, limit = 10, q = "", is_active } = req.query;
    
    const query = {};
    if (q) {
      query.code = { $regex: q, $options: "i" };
    }
    if (is_active !== undefined && is_active !== "") {
      query.is_active = is_active === "true";
    }

    const vouchers = await Voucher.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Voucher.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        vouchers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// GET /api/vouchers/:id
exports.getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id).lean();
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Không tìm thấy mã giảm giá" });
    }
    res.status(200).json({ success: true, data: voucher });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// POST /api/vouchers
exports.createVoucher = async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_value, max_discount, usage_limit, expiry_date, is_active } = req.body;
    
    // Check duplicate code
    const existing = await Voucher.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Mã giảm giá này đã tồn tại" });
    }

    const newVoucher = new Voucher({
      code,
      discount_type,
      discount_value,
      min_order_value,
      max_discount,
      usage_limit,
      expiry_date,
      is_active
    });

    await newVoucher.save();

    res.status(201).json({
      success: true,
      message: "Tạo mã giảm giá thành công",
      data: newVoucher,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// PUT /api/vouchers/:id
exports.updateVoucher = async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_value, max_discount, usage_limit, expiry_date, is_active } = req.body;
    
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Không tìm thấy mã giảm giá" });
    }

    // Tự động viết hoa code nếu được truyền lên
    if (code) {
      const existing = await Voucher.findOne({ code: code.toUpperCase(), _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: "Mã giảm giá này đã tồn tại" });
      }
      voucher.code = code.toUpperCase();
    }

    if (discount_type) voucher.discount_type = discount_type;
    if (discount_value !== undefined) voucher.discount_value = discount_value;
    if (min_order_value !== undefined) voucher.min_order_value = min_order_value;
    if (max_discount !== undefined) voucher.max_discount = max_discount;
    if (usage_limit !== undefined) voucher.usage_limit = usage_limit;
    if (expiry_date) voucher.expiry_date = expiry_date;
    if (is_active !== undefined) voucher.is_active = is_active;

    await voucher.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật mã giảm giá thành công",
      data: voucher,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// DELETE /api/vouchers/:id
exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Không tìm thấy mã giảm giá" });
    }

    // Nếu voucher đã có người dùng, chỉ tắt hoạt động thay vì xóa cứng
    if (voucher.used_count > 0) {
      voucher.is_active = false;
      await voucher.save();
      return res.status(200).json({
        success: true,
        message: "Mã giảm giá đã được sử dụng nên chỉ được vô hiệu hóa thay vì xóa hoàn toàn.",
      });
    }

    await Voucher.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Xóa mã giảm giá thành công",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};
