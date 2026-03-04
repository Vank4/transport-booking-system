const Flight = require("../models/flights.model");
const Ticket = require("../models/tickets.model");

// Tìm kiếm chuyến bay
exports.searchFlights = async (req, res) => {
  const { departure_airport_id, arrival_airport_id, date } = req.query;

  try {
    const flights = await Flight.find({
      departure_airport_id,
      arrival_airport_id,
      departure_time: { $gte: new Date(date) }, // Tìm chuyến bay khởi hành sau ngày chỉ định
    });

    if (flights.length === 0) {
      return res
        .status(404)
        .json({ message: "No flights found for your search criteria" });
    }

    res.status(200).json({ flights });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error searching for flights", error: err });
  }
};

// Tìm kiếm vé
exports.searchTickets = async (req, res) => {
  const { booking_code, passenger_name } = req.query;

  try {
    const tickets = await Ticket.find({
      booking_code,
      passenger_name: { $regex: passenger_name, $options: "i" }, // Tìm theo tên hành khách
    });

    if (tickets.length === 0) {
      return res
        .status(404)
        .json({ message: "No tickets found for your search criteria" });
    }

    res.status(200).json({ tickets });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error searching for tickets", error: err });
  }
};
