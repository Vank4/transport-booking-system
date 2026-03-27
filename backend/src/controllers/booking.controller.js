const Booking = require("../models/bookings.model");
const Payment = require("../models/payments.model");
const Seat = require("../models/seats.model");
const Ticket = require("../models/tickets.model");
const Voucher = require("../models/vouchers.model");
const FlightFare = require("../models/flightFares.model");
const Flight = require("../models/flights.model");
const TrainTrip = require("../models/trainTrips.model");
const Airport = require("../models/airports.model");
const TrainStation = require("../models/trainStations.model");
const Airline = require("../models/airlines.model");
const Train = require("../models/trains.model");

function mapBookingStatus(status) {
  if (status === "CONFIRMED") return "paid";
  if (status === "WAITING_PAYMENT" || status === "PENDING") return "pending";
  return "expired";
}

async function buildFlightBookingView(booking) {
  const flight = await Flight.findById(booking.trip_id).lean();
  if (!flight) return null;

  const [departureAirport, arrivalAirport, airline] = await Promise.all([
    Airport.findById(flight.departure_airport_id).lean(),
    Airport.findById(flight.arrival_airport_id).lean(),
    Airline.findById(flight.airline_id).lean(),
  ]);

  const origin = departureAirport?.city || "Ch\u01b0a x\u00e1c \u0111\u1ecbnh";
  const destination = arrivalAirport?.city || "Ch\u01b0a x\u00e1c \u0111\u1ecbnh";

  return {
    id: booking._id,
    code: booking.booking_code,
    route: `${origin} \u2192 ${destination}`,
    origin,
    destination,
    bookingDate: booking.created_at,
    departureDate: flight.departure_time,
    arrivalDate: flight.arrival_time,
    status: mapBookingStatus(booking.status),
    transportType: "flight",
    carrier: airline?.name || flight.flight_number || "Chuy\u1ebfn bay",
    price: booking.total_amount,
  };
}

async function buildTrainBookingView(booking) {
  const trainTrip = await TrainTrip.findById(booking.trip_id).lean();
  if (!trainTrip) return null;

  const [departureStation, arrivalStation, train] = await Promise.all([
    TrainStation.findById(trainTrip.departure_station_id).lean(),
    TrainStation.findById(trainTrip.arrival_station_id).lean(),
    Train.findById(trainTrip.train_id).lean(),
  ]);

  const origin = departureStation?.city || departureStation?.name || "Ch\u01b0a x\u00e1c \u0111\u1ecbnh";
  const destination = arrivalStation?.city || arrivalStation?.name || "Ch\u01b0a x\u00e1c \u0111\u1ecbnh";

  return {
    id: booking._id,
    code: booking.booking_code,
    route: `${origin} \u2192 ${destination}`,
    origin,
    destination,
    bookingDate: booking.created_at,
    departureDate: trainTrip.departure_time,
    arrivalDate: trainTrip.arrival_time,
    status: mapBookingStatus(booking.status),
    transportType: "train",
    carrier: train?.name || train?.train_number || "Chuy\u1ebfn t\u00e0u",
    price: booking.total_amount,
  };
}

const getRequestUserId = (req) => (req.user && req.user.userId ? req.user.userId : null);
const getAuthFailureMessage = (req) =>
  req.authError || "Vui long dang nhap de truy cap booking nay!";


// TĂ¡ÂºÂ¡o booking mĂ¡Â»â€ºi
exports.createBooking = async (req, res) => {
  try {
    const { trip_id, booking_type, seats, passengers } = req.body;
    const user_id = getRequestUserId(req);

    // 1. KiĂ¡Â»Æ’m tra trĂ¡ÂºÂ¡ng thĂƒÂ¡i hĂƒÂ ng ghĂ¡ÂºÂ¿
    const seatDocs = await Seat.find({ _id: { $in: seats } });
    if (seatDocs.length !== seats.length) {
      return res.status(400).json({ message: 'MĂ¡Â»â„¢t hoĂ¡ÂºÂ·c nhiĂ¡Â»Âu mĂƒÂ£ ghĂ¡ÂºÂ¿ khĂƒÂ´ng tĂ¡Â»â€œn tĂ¡ÂºÂ¡i.' });
    }

    let total_amount = 0;

    // Map Ă„â€˜Ă¡Â»Æ’ tra cĂ¡Â»Â©u giĂƒÂ¡ tĂ¡Â»Â«ng ghĂ¡ÂºÂ¿ nhanh hĂ†Â¡n (seat_id \u2192 final_price)
    const seatPriceMap = {};
    const now = new Date();

    for (let seat of seatDocs) {
      if (seat.status === 'BOOKED') {
        return res.status(400).json({ message: `GhĂ¡ÂºÂ¿ ${seat.seat_number} Ă„â€˜ĂƒÂ£ cĂƒÂ³ ngĂ†Â°Ă¡Â»Âi Ă„â€˜Ă¡ÂºÂ·t hoĂ¡ÂºÂ·c Ă„â€˜ang giĂ¡Â»Â¯.` });
      }

      if (seat.status === 'HELD') {
        const heldBySameUser =
          user_id &&
          seat.held_by &&
          seat.held_by.toString() === user_id.toString();
        const holdStillValid =
          seat.hold_expired_at && new Date(seat.hold_expired_at) > now;

        if (!heldBySameUser || !holdStillValid) {
          return res.status(400).json({ message: `GhĂ¡ÂºÂ¿ ${seat.seat_number} Ă„â€˜ĂƒÂ£ cĂƒÂ³ ngĂ†Â°Ă¡Â»Âi Ă„â€˜Ă¡ÂºÂ·t hoĂ¡ÂºÂ·c Ă„â€˜ang giĂ¡Â»Â¯.` });
        }
      }

      // 2. Query bĂ¡ÂºÂ£ng giĂƒÂ¡ tĂ¡Â»Â« FlightFare theo chuyĂ¡ÂºÂ¿n bay + hĂ¡ÂºÂ¡ng ghĂ¡ÂºÂ¿
      // ChĂ¡Â»â€° ĂƒÂ¡p dĂ¡Â»Â¥ng cho FLIGHT; TRAIN dĂƒÂ¹ng base_price cĂ¡Â»Â§a TrainCarriage
      let seatPrice = 0;

      if (booking_type === 'FLIGHT') {
        const fare = await FlightFare.findOne({
          flight_id: trip_id,
          cabin_class: seat.class,
          is_active: true,
        });

        if (fare) {
          // Ă†Â¯u tiĂƒÂªn giĂƒÂ¡ khuyĂ¡ÂºÂ¿n mĂƒÂ£i, nĂ¡ÂºÂ¿u khĂƒÂ´ng cĂƒÂ³ thĂƒÂ¬ dĂƒÂ¹ng giĂƒÂ¡ gĂ¡Â»â€˜c
          const effectivePrice = fare.promo_price != null ? fare.promo_price : fare.base_price;
          seatPrice = effectivePrice + (seat.price_modifier || 0);
        } else {
          const flight = await Flight.findById(trip_id).lean();
          const normalizedClass = String(seat.class || '').toLowerCase();
          const fallbackPrice =
            flight?.prices?.[normalizedClass] ??
            flight?.prices?.economy;

          if (fallbackPrice == null) {
            return res.status(400).json({
              message: `KhĂƒÂ´ng tĂƒÂ¬m thĂ¡ÂºÂ¥y bĂ¡ÂºÂ£ng giĂƒÂ¡ cho hĂ¡ÂºÂ¡ng ${seat.class} trĂƒÂªn chuyĂ¡ÂºÂ¿n bay nĂƒÂ y. Vui lĂƒÂ²ng liĂƒÂªn hĂ¡Â»â€¡ quĂ¡ÂºÂ£n trĂ¡Â»â€¹ viĂƒÂªn.`,
            });
          }

          seatPrice = fallbackPrice + (seat.price_modifier || 0);
        }
      } else {
        // TRAIN
        seatPrice = seat.price_modifier || 0;
      }

      seatPriceMap[seat._id.toString()] = seatPrice;
      total_amount += seatPrice;
    }

    // 3. TĂ¡ÂºÂ¡o Booking
    const newBooking = new Booking({
      user_id: user_id,
      booking_code: "BKG" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000),
      booking_type: booking_type,
      trip_id: trip_id,
      total_amount: total_amount,
      status: 'WAITING_PAYMENT',
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    });

    await newBooking.save();

    // 4. TĂ¡ÂºÂ¡o Ticket vĂ¡Â»â€ºi final_price Ă„â€˜ĂƒÂºng tĂ¡Â»Â« bĂ¡ÂºÂ£ng giĂƒÂ¡ Tra cĂ¡Â»Â©u Ă„â€˜Ă†Â°Ă¡Â»Â£c
    const ticketPromises = passengers.map(async (p) => {
      const finalPrice = seatPriceMap[p.seat_id.toString()] || 0;

      return Ticket.create({
        booking_id: newBooking._id,
        seat_id: p.seat_id,
        passenger_name: p.passenger_name,
        passenger_id_card: p.passenger_id_card,
        final_price: finalPrice,
      });
    });

    await Promise.all(ticketPromises);

    // 5. KhoĂƒÂ¡ ghĂ¡ÂºÂ¿ Ă„â€˜Ă¡Â»Æ’ ngĂ„Æ’n ngĂ†Â°Ă¡Â»Âi khĂƒÂ¡c Ă„â€˜Ă¡ÂºÂ·t trĂƒÂ¹ng
    await Seat.updateMany(
      { _id: { $in: seats } },
      { $set: { status: 'HELD', held_by_booking_id: newBooking._id } }
    );

    res.status(201).json({
      message: "Booking created successfully, pending for payment",
      booking: newBooking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error!" });
  }
};

// XĂ¡Â»Â­ lĂƒÂ½ thanh toĂƒÂ¡n
exports.processPayment = async (req, res) => {
  try {
    const { booking_id, method, transaction_id, amount, status } = req.body;
    const requestUserId = getRequestUserId(req);

    // kiĂ¡Â»Æ’m tra booking tĂ¡Â»â€œn tĂ¡ÂºÂ¡i
    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found!" });
    }

    // kiĂ¡Â»Æ’m tra booking thuĂ¡Â»â„¢c user
    if (booking.user_id && !requestUserId) {
      return res.status(401).json({
        message: getAuthFailureMessage(req),
      });
    }

    if (booking.user_id && booking.user_id.toString() !== requestUserId) {
      return res.status(403).json({
        message: "You are not allowed to pay for this booking",
      });
    }

    const payment = new Payment({
      booking_id,
      method,
      transaction_id,
      amount,
      status,
      paid_at: new Date(),
    });

    await payment.save();

    // cĂ¡ÂºÂ­p nhĂ¡ÂºÂ­t trĂ¡ÂºÂ¡ng thĂƒÂ¡i booking nĂ¡ÂºÂ¿u thanh toĂƒÂ¡n thĂƒÂ nh cĂƒÂ´ng
    if (status === "SUCCESS") {
      booking.status = "CONFIRMED";
      await booking.save();
    }

    res.status(200).json({
      message: "Payment processed successfully!",
      payment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error!" });
  }
};

// LĂ¡ÂºÂ¥y tĂ¡ÂºÂ¥t cĂ¡ÂºÂ£ booking cĂ¡Â»Â§a user Ă„â€˜ang Ă„â€˜Ă„Æ’ng nhĂ¡ÂºÂ­p
exports.getAllBookings = async (req, res) => {
  try {
    const requestUserId = getRequestUserId(req);

    if (!requestUserId) {
      return res.status(401).json({ message: getAuthFailureMessage(req) });
    }

    const bookings = await Booking.find({
      user_id: requestUserId,
    })
      .sort({ created_at: -1 })
      .lean();

    const data = (
      await Promise.all(
        bookings.map((booking) =>
          booking.booking_type === "FLIGHT"
            ? buildFlightBookingView(booking)
            : buildTrainBookingView(booking),
        ),
      )
    ).filter(Boolean);
    res.status(200).json({
      count: data.length,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error!" });
  }
};
// ĂƒÂp dĂ¡Â»Â¥ng Voucher vĂƒÂ o Booking
exports.applyVoucher = async (req, res) => {
  try {
    const { booking_id, voucher_code } = req.body;

    // KAN-209: KiĂ¡Â»Æ’m tra Ă„â€˜Ă¡ÂºÂ§u vĂƒÂ o tĂ¡Â»â€œn tĂ¡ÂºÂ¡i vĂƒÂ  tĂƒÂ¬m Booking
    if (!booking_id || !voucher_code) {
      return res.status(400).json({ success: false, message: "ThiĂ¡ÂºÂ¿u mĂƒÂ£ Booking hoĂ¡ÂºÂ·c MĂƒÂ£ giĂ¡ÂºÂ£m giĂƒÂ¡!" });
    }

    const Booking = require("../models/bookings.model");
    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "KhĂƒÂ´ng tĂƒÂ¬m thĂ¡ÂºÂ¥y thĂƒÂ´ng tin chuyĂ¡ÂºÂ¿n Ă„â€˜i (Booking)!" });
    }

    // CHECK NĂ¡ÂºÂ¾U Ă„ÂĂƒÆ’ ĂƒÂP DĂ¡Â»Â¤NG VOUCHER RĂ¡Â»â€™I
    if (booking.voucher_applied) {
      return res.status(400).json({ success: false, message: "Booking nĂƒÂ y Ă„â€˜ĂƒÂ£ Ă„â€˜Ă†Â°Ă¡Â»Â£c ĂƒÂ¡p dĂ¡Â»Â¥ng mĂƒÂ£ giĂ¡ÂºÂ£m giĂƒÂ¡. KhĂƒÂ´ng thĂ¡Â»Æ’ ĂƒÂ¡p dĂ¡Â»Â¥ng thĂƒÂªm!" });
    }

    // TĂ†Â°Ă¡Â»Âng lĂ¡Â»Â­a chĂ¡Â»â€˜ng lĂ¡ÂºÂ¥y trĂ¡Â»â„¢m / sĂ¡Â»Â­a Booking ngĂ†Â°Ă¡Â»Âi khĂƒÂ¡c
    const requestUserId = getRequestUserId(req);
    if (booking.user_id && !requestUserId) {
      return res.status(401).json({ success: false, message: getAuthFailureMessage(req) });
    }
    if (booking.user_id && booking.user_id.toString() !== requestUserId) {
      return res.status(403).json({ success: false, message: "BĂ¡ÂºÂ¡n khĂƒÂ´ng cĂƒÂ³ quyĂ¡Â»Ân sĂ¡Â»Â­a Ă„â€˜Ă¡Â»â€¢i Booking nĂƒÂ y!" });
    }

    // ChĂ¡ÂºÂ·n ĂƒÂ¡p dĂ¡Â»Â¥ng lĂƒÂªn Booking Ă„â€˜ĂƒÂ£ nĂ¡Â»â„¢p tiĂ¡Â»Ân
    if (booking.status !== "WAITING_PAYMENT" && booking.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Booking Ă„â€˜ĂƒÂ£ hĂ¡ÂºÂ¿t hĂ¡ÂºÂ¡n, Ă„â€˜ĂƒÂ£ hĂ¡Â»Â§y hoĂ¡ÂºÂ·c Ă„â€˜ĂƒÂ£ hoĂƒÂ n tĂ¡ÂºÂ¥t thanh toĂƒÂ¡n!" });
    }

    // KAN-209 & KAN-210: KiĂ¡Â»Æ’m tra Ă„â€˜iĂ¡Â»Âu kiĂ¡Â»â€¡n khĂ¡ÂºÂ¯c nghiĂ¡Â»â€¡t cĂ¡Â»Â§a Voucher
    const voucher = await Voucher.findOne({ code: voucher_code.toUpperCase() });

    if (!voucher) {
      return res.status(404).json({ success: false, message: "MĂƒÂ£ giĂ¡ÂºÂ£m giĂƒÂ¡ khĂƒÂ´ng tĂ¡Â»â€œn tĂ¡ÂºÂ¡i!" });
    }

    if (!voucher.is_active || voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ success: false, message: "MĂƒÂ£ giĂ¡ÂºÂ£m giĂƒÂ¡ Ă„â€˜ĂƒÂ£ hĂ¡ÂºÂ¿t lĂ†Â°Ă¡Â»Â£t sĂ¡Â»Â­ dĂ¡Â»Â¥ng hoĂ¡ÂºÂ·c bĂ¡Â»â€¹ vĂƒÂ´ hiĂ¡Â»â€¡u hĂƒÂ³a!" });
    }

    const now = new Date();
    if (now > voucher.expiry_date) {
      return res.status(400).json({ success: false, message: "MĂƒÂ£ giĂ¡ÂºÂ£m giĂƒÂ¡ Ă„â€˜ĂƒÂ£ hĂ¡ÂºÂ¿t hĂ¡ÂºÂ¡n sĂ¡Â»Â­ dĂ¡Â»Â¥ng!" });
    }

    if (booking.total_amount < voucher.min_order_value) {
      return res.status(400).json({ success: false, message: `MĂƒÂ£ giĂ¡ÂºÂ£m giĂƒÂ¡ chĂ¡Â»â€° ĂƒÂ¡p dĂ¡Â»Â¥ng cho Ă„â€˜Ă†Â¡n hĂƒÂ ng tĂ¡Â»Â« ${voucher.min_order_value.toLocaleString()} VND!` });
    }

    // KAN-211: TĂƒÂ­nh toĂƒÂ¡n sĂ¡Â»â€˜ tiĂ¡Â»Ân Ă„â€˜Ă†Â°Ă¡Â»Â£c giĂ¡ÂºÂ£m giĂƒÂ¡
    let discount_amount = 0;
    if (voucher.discount_type === "PERCENTAGE") {
      // TĂƒÂ­nh theo %
      discount_amount = (booking.total_amount * voucher.discount_value) / 100;
      // ĂƒÂp trĂ¡ÂºÂ§n tĂ¡Â»â€˜i Ă„â€˜a
      if (voucher.max_discount && discount_amount > voucher.max_discount) {
        discount_amount = voucher.max_discount;
      }
    } else {
      // FIXED - TrĂ¡Â»Â« thĂ¡ÂºÂ³ng tiĂ¡Â»Ân mĂ¡ÂºÂ·t
      discount_amount = voucher.discount_value;
    }

    // ChĂ¡ÂºÂ·n sĂ¡Â»â€˜ Ăƒâ€m (NĂ¡ÂºÂ¿u voucher 500k ĂƒÂ¡p cho hoĂƒÂ¡ Ă„â€˜Ă†Â¡n 100k)
    if (discount_amount >= booking.total_amount) {
      discount_amount = booking.total_amount;
    }

    const old_total = booking.total_amount;
    const new_total = booking.total_amount - discount_amount;

    // KAN-212: TiĂƒÂªu hao lĂ†Â°Ă¡Â»Â£t dĂƒÂ¹ng Voucher & CĂ¡ÂºÂ­p nhĂ¡ÂºÂ­t HoĂƒÂ¡ Ă„ÂĂ†Â¡n
    voucher.used_count += 1;
    await voucher.save();

    booking.total_amount = new_total;
    booking.voucher_applied = voucher.code; // LĂ†Â¯U DĂ¡ÂºÂ¤U VĂ¡ÂºÂ¾T Ă„ÂĂƒÆ’ ĂƒÂP DĂ¡Â»Â¤NG
    await booking.save(); // LĂ†Â°u giĂƒÂ¡ mĂ¡Â»â€ºi vĂƒÂ o DB

    // PhĂ¡ÂºÂ£n hĂ¡Â»â€œi vĂ¡Â»Â Frontend thĂƒÂ nh cĂƒÂ´ng
    res.status(200).json({
      success: true,
      message: "ĂƒÂp dĂ¡Â»Â¥ng mĂƒÂ£ giĂ¡ÂºÂ£m giĂƒÂ¡ thĂƒÂ nh cĂƒÂ´ng!",
      data: {
        booking_id: booking._id,
        voucher_code: voucher.code,
        old_total: old_total,
        discount_amount: discount_amount,
        final_total: new_total
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "LĂ¡Â»â€”i hĂ¡Â»â€¡ thĂ¡Â»â€˜ng khi ĂƒÂ¡p dĂ¡Â»Â¥ng voucher!" });
  }
};


// Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬ KAN-213: Xem lĂ¡ÂºÂ¡i toĂƒÂ n bĂ¡Â»â„¢ thĂƒÂ´ng tin Booking trĂ†Â°Ă¡Â»â€ºc khi Checkout Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬Ă¢â€â‚¬
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // KAN-214 & KAN-215: TĂƒÂ¬m kiĂ¡ÂºÂ¿m Booking vĂƒÂ  kiĂ¡Â»Æ’m tra tĂƒÂ­nh hĂ¡Â»Â£p lĂ¡Â»â€¡
    const booking = await Booking.findById(bookingId).lean();

    if (!booking) {
      return res.status(404).json({ success: false, message: "KhĂƒÂ´ng tĂƒÂ¬m thĂ¡ÂºÂ¥y thĂƒÂ´ng tin chuyĂ¡ÂºÂ¿n Ă„â€˜i (Booking)!" });
    }

    const requestUserId = getRequestUserId(req);
    if (booking.user_id && !requestUserId) {
      return res.status(401).json({ success: false, message: getAuthFailureMessage(req) });
    }
    if (booking.user_id && booking.user_id.toString() !== requestUserId) {
      return res.status(403).json({ success: false, message: "BĂ¡ÂºÂ¡n khĂƒÂ´ng cĂƒÂ³ quyĂ¡Â»Ân truy cĂ¡ÂºÂ­p thĂƒÂ´ng tin Booking nĂƒÂ y!" });
    }

    // KAN-216: Gom thĂƒÂ´ng tin HĂƒÂ nh KhĂƒÂ¡ch & GhĂ¡ÂºÂ¿ ngĂ¡Â»â€œi tĂ¡Â»Â« bĂ¡ÂºÂ£ng Tickets
    const tickets = await Ticket.find({ booking_id: booking._id })
      .populate({
        path: 'seat_id',
        select: 'seat_number class price_modifier status'
      })
      .lean();

    let passengerDetails = [];
    let totalDiscount = 0;

    // KAN-217: GhĂƒÂ©p nĂ¡Â»â€˜i DĂ¡Â»Â¯ liĂ¡Â»â€¡u PhĂ¡Â»Â¥ (TĂƒÂ­nh nĂ„Æ’ng Voucher TĂ†Â°Ă†Â¡ng lai)
    if (tickets && tickets.length > 0) {
      passengerDetails = tickets.map(ticket => {
        return {
          ticket_id: ticket._id,
          passenger_name: ticket.passenger_name,
          id_card: ticket.passenger_id_card,
          seat_info: ticket.seat_id ? {
            id: ticket.seat_id._id,
            number: ticket.seat_id.seat_number,
            class: ticket.seat_id.class,
            additional_fee: ticket.seat_id.price_modifier
          } : null,
          final_price: ticket.final_price,
          date_of_birth: ticket.date_of_birth,
          gender: ticket.gender,
          passenger_type: ticket.passenger_type,
          contact_info: ticket.contact_info
        };
      });
    }

    // KAN-218: GĂƒÂ³i ghĂƒÂ©m tĂ¡ÂºÂ¥t cĂ¡ÂºÂ£ Data trĂ¡ÂºÂ£ vĂ¡Â»Â cho Giao DiĂ¡Â»â€¡n Xong XuĂƒÂ´i
    res.status(200).json({
      success: true,
      data: {
        booking_summary: {
          id: booking._id,
          code: booking.booking_code,
          type: booking.booking_type,
          trip_id: booking.trip_id,
          status: booking.status,
          created_at: booking.created_at,
          expires_at: booking.expires_at,
        },
        financials: {
          total_amount: booking.total_amount, // Ă„ÂĂƒÂ£ tĂ¡Â»Â± gĂƒÂ¡nh tiĂ¡Â»Ân trĂ¡Â»Â« tĂ¡Â»Â« hĂƒÂ m Voucher trĂ†Â°Ă¡Â»â€ºc Ă„â€˜ĂƒÂ³
          discount_applied: totalDiscount
        },
        passengers: passengerDetails
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "LĂ¡Â»â€”i hĂ¡Â»â€¡ thĂ¡Â»â€˜ng khi tĂ¡ÂºÂ£i thĂƒÂ´ng tin xĂƒÂ¡c nhĂ¡ÂºÂ­n!" });
  }
};
