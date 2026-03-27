// const { authenticate } = require("../middleware/auth.middleware");
// const { authorizeRoles } = require("../middleware/role.middleware");
const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller");
const { validate } = require("../middleware/validate.middleware");
const { updateUserSchema, getUsersSchema } = require("../validators/user.validator");

// Batch update (role / status) cho nhiều user
router.put("/batch-update", async (req, res) => {
  try {
    const { userIds, role, status } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "Cần chọn ít nhất 1 người dùng." });
    }
    const updateFields = {};
    if (role) updateFields.role = role;
    if (status) updateFields.status = status;
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: "Cần chọn hành động (role hoặc status)." });
    }
    const result = await require("../models/users.model").updateMany(
      { _id: { $in: userIds } },
      { $set: { ...updateFields, updated_at: new Date() } }
    );
    res.json({ success: true, message: `Đã cập nhật ${result.modifiedCount} người dùng.`, data: { modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xem thông tin tất cả users
router.get("/", validate(getUsersSchema, "query"), userController.getUsers);

// Tạo user mới (Admin)
router.post("/", userController.createUser);

// Xem thông tin chi tiết của 1 user
router.get("/:id", userController.getUserById);

// Cập nhật thông tin user
router.put("/:id", validate(updateUserSchema, "body"), userController.updateUser);

// Xóa user
router.delete("/:id", userController.deleteUser);

// Khóa tài khoản
router.put("/:id/block", userController.blockUser);

// Mở khóa tài khoản
router.put("/:id/unblock", userController.unblockUser);

// Xem thông tin tất cả users
// router.get("/", authenticate, authorizeRoles("ADMIN"), validate(getUsersSchema, "query"), userController.getUsers);

// // Xem thông tin chi tiết của 1 user
// router.get("/:id", authenticate, authorizeRoles("ADMIN"), userController.getUserById);

// // Cập nhật thông tin user
// router.put("/:id", authenticate, authorizeRoles("ADMIN"), validate(updateUserSchema, "body"), userController.updateUser);

// // Xóa user
// router.delete("/:id", authenticate, authorizeRoles("ADMIN"), userController.deleteUser);

// // Khóa tài khoản
// router.put("/:id/block", authenticate, authorizeRoles("ADMIN"), userController.blockUser);

// // Mở khóa tài khoản
// router.put("/:id/unblock", authenticate, authorizeRoles("ADMIN"), userController.unblockUser);

module.exports = router;