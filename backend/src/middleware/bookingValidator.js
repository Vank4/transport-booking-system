exports.validateBookingData = (req, res, next) => {
    const { trip_id, booking_type, seats, passengers } = req.body;

    if (!trip_id || !booking_type || !seats || !passengers) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc: trip_id, booking_type, seats hoặc passengers' });
    }

    // Đã bỏ check req.user để mở cửa cho Khách vãng lai

    if (!['FLIGHT', 'TRAIN'].includes(booking_type)) {
        return res.status(400).json({ success: false, message: 'Loại chuyến đi (booking_type) phải là FLIGHT hoặc TRAIN' });
    }

    if (seats.length !== passengers.length) {
        return res.status(400).json({ success: false, message: 'Số lượng hành khách phải khớp hoàn toàn với số ghế' });
    }

    next();
};
