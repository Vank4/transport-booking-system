const { Server } = require("socket.io");
const env = require("./config/env");

let io = null;

/**
 * Initialise Socket.io and attach it to the given HTTP server.
 * Called once in server.js during bootstrap.
 */
function initSocket(httpServer) {
	io = new Server(httpServer, {
		cors: {
			origin: env.corsOrigin,
			methods: ["GET", "POST"],
			credentials: true,
		},
		// Prevent duplicate events when the socket reconnects
		connectionStateRecovery: {
			maxDisconnectionDuration: 2 * 60 * 1000, // 2 min
			skipMiddlewares: true,
		},
	});

	io.on("connection", (socket) => {
		console.log(`[Socket] Client connected: ${socket.id}`);

		// Client asks to watch a specific trip
		socket.on("join_trip", (tripId) => {
			if (!tripId) return;
			const room = `trip:${tripId}`;
			socket.join(room);
			console.log(`[Socket] ${socket.id} joined room ${room}`);
		});

		// Client leaves a trip (e.g. navigates away)
		socket.on("leave_trip", (tripId) => {
			if (!tripId) return;
			socket.leave(`trip:${tripId}`);
		});

		socket.on("disconnect", (reason) => {
			console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
		});
	});

	return io;
}

/**
 * Returns the Socket.io instance. Must call initSocket() first.
 */
function getIO() {
	if (!io) throw new Error("Socket.io has not been initialised yet.");
	return io;
}

/**
 * Broadcast a seat status change to every client watching the given trip.
 *
 * @param {string}  tripId    - The trip whose room receives the event.
 * @param {string}  event     - Event name: seat_held | seat_released | seat_booked | seat_update
 * @param {object}  payload   - { tripId, seatId, seat_number, status, updatedAt }
 */
function emitSeatUpdate(tripId, event, payload) {
	if (!io || !tripId) return;
	io.to(`trip:${tripId}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitSeatUpdate };
