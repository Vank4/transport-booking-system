const userService = require("../services/users.service");
const { successResponse } = require("../utils/apiResponse");

const userController = {
    async createUser(req, res, next) {
        try {
            const user = await userService.createUser(req.body);
            return successResponse(res, "Create user success", user, 201);
        } catch (error) {
            return next(error);
        }
    },

    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.getUserById(id);
            return successResponse(res, "Get user success", user);
        } catch (error) {
            return next(error);
        }
    },

    async getUsers(req, res, next) {
        try {
            const { role, status, q, page, limit, sortBy, sortOrder } = req.query;
            const result = await userService.getUsers({ role, status, q, page, limit, sortBy, sortOrder });
            return successResponse(res, "Get users success", result);
        } catch (error) {
            return next(error);
        }
    },

    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.updateUser(id, req.body);
            return successResponse(res, "Update user success", user);
        } catch (error) {
            return next(error);
        }
    },

    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.deleteUser(id);
            return successResponse(res, "Delete user success", user);
        } catch (error) {
            return next(error);
        }
    },

    async blockUser(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.blockUser(id);
            return successResponse(res, "Block user success", user);
        } catch (error) {
            return next(error);
        }
    },

    async unblockUser(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.unblockUser(id);
            return successResponse(res, "Unblock user success", user);
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = userController;