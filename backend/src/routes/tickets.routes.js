const express = require("express");
const router = express.Router();
const ticketsController = require("../controllers/tickets.controller");

// Temporary un-protected routes for rapid development
router.get("/", ticketsController.getAllTickets);
router.get("/:id", ticketsController.getTicketById);
router.put("/:id", ticketsController.updateTicket);
router.delete("/:id", ticketsController.deleteTicket);

module.exports = router;
