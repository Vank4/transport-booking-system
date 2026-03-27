const User = require("../models/users.model");
const AppError = require("../utils/appError");

const userService = {
    async getUserById(id) {
        const user = await User.findById(id).select("-password_hash");
        if (!user) {
            throw new AppError("User not found", 404);
        }
        return user;
    },

    async getUsers(queryFilters = {}) {
        const { role, status, q, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = queryFilters;
        let filter = {};

        if (role && role !== "ALL") {
            filter.role = role;
        }
        if (status && status !== "ALL") {
            filter.status = status;
        }
        if (q) {
            const mongoose = require("mongoose");
            filter.$or = [
                { full_name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } }
            ];
            if (mongoose.isValidObjectId(q)) {
                filter.$or.push({ _id: q });
            }
        }

        const skip = (Number(page) - 1) * Number(limit);
        const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-password_hash")
                .sort(sort)
                .skip(skip)
                .limit(Number(limit)),
            User.countDocuments(filter)
        ]);

        return {
            users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        };
    },

    async createUser(data) {
        const bcrypt = require("bcrypt");
        const { full_name, email, phone, date_of_birth, gender, nationality, id_card, passport, address, role, status, password } = data;
        if (!full_name || !email || !password) {
            throw new AppError("Họ tên, email và mật khẩu là bắt buộc", 400);
        }
        const existing = await User.findOne({ email });
        if (existing) {
            throw new AppError("Email đã tồn tại trong hệ thống", 409);
        }
        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            full_name, email, phone, date_of_birth: date_of_birth || null, gender, nationality, id_card, passport, address,
            role: role || "USER", status: status || "ACTIVE", password_hash,
        });
        const result = user.toObject();
        delete result.password_hash;
        return result;
    },

    async updateUser(id, updateData) {
        const allowedFields = [
            "full_name", "email", "phone", "date_of_birth", "gender",
            "nationality", "id_card", "passport", "address", "role", "status"
        ];
        const payload = {};
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                payload[field] = updateData[field];
            }
        }
        payload.updated_at = new Date();

        const user = await User.findByIdAndUpdate(
            id,
            { $set: payload },
            { returnDocument: "after", runValidators: true }
        ).select("-password_hash");

        if (!user) {
            throw new AppError("User not found", 404);
        }
        return user;
    },

    async deleteUser(id) {
        const user = await User.findByIdAndDelete(
            id,
            { returnDocument: "after", runValidators: true }
        ).select("-password_hash");

        if (!user) {
            throw new AppError("User not found", 404);
        }
        return user;
    },

    async blockUser(id) {
        const targetUser = await User.findById(id);
        if (!targetUser) {
            throw new AppError("User not found", 404);
        }

        if (targetUser.role === "ADMIN") {
            throw new AppError("Cannot block another Admin account", 403);
        }

        const user = await User.findByIdAndUpdate(
            id,
            { status: "BLOCKED" },
            { returnDocument: "after", runValidators: true }
        ).select("-password_hash");

        return user;
    },

    async unblockUser(id) {
        const user = await User.findByIdAndUpdate(
            id,
            { status: "ACTIVE" },
            { returnDocument: "after", runValidators: true }
        ).select("-password_hash");

        if (!user) {
            throw new AppError("User not found", 404);
        }
        return user;
    }
};

module.exports = userService;
