const express = require("express");
const router = express.Router();
const ticketsController = require("../controllers/tickets.controller");

const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/role.middleware");

// Temporary un-protected routes for rapid development
router.get("/", ticketsController.getAllTickets);
router.get("/:id", ticketsController.getTicketById);
router.put("/:id", authMiddleware, authorizeRoles("ADMIN"), ticketsController.updateTicket);
router.delete("/:id", authMiddleware, authorizeRoles("ADMIN"), ticketsController.deleteTicket);

module.exports = router;
