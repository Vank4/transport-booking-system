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

    async updateUser(id, updateData) {
        const { full_name, email, phone, role, status } = updateData;
        const payload = {};
        if (full_name !== undefined) payload.full_name = full_name;
        if (email !== undefined) payload.email = email;
        if (phone !== undefined) payload.phone = phone;
        if (role !== undefined) payload.role = role;
        if (status !== undefined) payload.status = status;

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
