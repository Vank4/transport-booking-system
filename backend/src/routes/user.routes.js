const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller");
const { validate } = require("../middleware/validate.middleware");
const { updateUserSchema, getUsersSchema } = require("../validators/user.validator");

// Xem thông tin tất cả users
router.get("/", authenticate, authorizeRoles("ADMIN"), validate(getUsersSchema, "query"), userController.getUsers);

// Xem thông tin chi tiết của 1 user
router.get("/:id", authenticate, authorizeRoles("ADMIN"), userController.getUserById);

// Cập nhật thông tin user
router.put("/:id", authenticate, authorizeRoles("ADMIN"), validate(updateUserSchema, "body"), userController.updateUser);

// Xóa user
router.delete("/:id", authenticate, authorizeRoles("ADMIN"), userController.deleteUser);

// Khóa tài khoản
router.put("/:id/block", authenticate, authorizeRoles("ADMIN"), userController.blockUser);

// Mở khóa tài khoản
router.put("/:id/unblock", authenticate, authorizeRoles("ADMIN"), userController.unblockUser);

module.exports = router;