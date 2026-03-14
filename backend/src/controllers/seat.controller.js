const seatService = require("../services/seat.service");
const { SeatServiceError } = require("../services/seat.service");

// Helper: maps a SeatServiceError to the correct HTTP response
function handleError(res, err, label) {
	if (err instanceof SeatServiceError) {
		return res.status(err.statusCode).json({
			status: "error",
			...(err.code && { code: err.code }),
			message: err.message,
		});
	}
	console.error(`[${label}]`, err);
	return res.status(500).json({ status: "error", message: "Internal server error." });
}

// GET /api/seats/status/:seatId
exports.checkSeatStatus = async (req, res) => {
	try {
		const data = await seatService.getSeatStatus(req.params.seatId);
		res.status(200).json({ status: "success", data });
	} catch (err) {
		handleError(res, err, "checkSeatStatus");
	}
};

// POST /api/seats/hold
exports.holdSeats = async (req, res) => {
	try {
		const data = await seatService.holdSeats({
			...req.body,
			userId: req.user.userId,
		});
		res.status(200).json({ status: "success", data });
	} catch (err) {
		handleError(res, err, "holdSeats");
	}
};

// POST /api/seats/release
exports.releaseSeats = async (req, res) => {
	try {
		const data = await seatService.releaseSeats({
			...req.body,
			userId: req.user.userId,
		});
		res.status(200).json({ status: "success", data });
	} catch (err) {
		handleError(res, err, "releaseSeats");
	}
};

// GET /api/seats/map/:tripId
exports.getSeatMap = async (req, res) => {
	try {
		const data = await seatService.getSeatMap(req.params.tripId);
		res.status(200).json({ status: "success", data });
	} catch (err) {
		handleError(res, err, "getSeatMap");
	}
};

// POST /api/seats/select
exports.selectSeats = async (req, res) => {
	try {
		const data = await seatService.selectSeats({
			...req.body,
			userId: req.user.userId,
		});
		res.status(200).json({ status: "success", data });
	} catch (err) {
		handleError(res, err, "selectSeats");
	}
};
