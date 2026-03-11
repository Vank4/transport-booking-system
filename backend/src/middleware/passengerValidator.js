exports.validatePassengerData = (req, res, next) => {
    const { trip_id, seats, passengers } = req.body;
    if (!trip_id || !seats || !passengers) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp trip_id, seats và passengers.' });
    if (seats.length !== passengers.length) return res.status(400).json({ success: false, message: `Số lượng hành khách (${passengers.length}) không khớp với ghế (${seats.length}).` });

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/; 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seatIdSet = new Set(seats.map(id => id.toString()));
    const assignedSeats = new Set(); 

    for (let p of passengers) {
        if (!p.contact_info || !phoneRegex.test(p.contact_info.phone)) return res.status(400).json({ success: false, message: `Số điện thoại của ${p.passenger_name} không hợp lệ.` });
        if (!emailRegex.test(p.contact_info.email)) return res.status(400).json({ success: false, message: `Email của ${p.passenger_name} không hợp lệ.` });
        if (!seatIdSet.has(p.seat_id.toString())) return res.status(400).json({ success: false, message: `Ghế ${p.seat_id} không nằm trong danh sách ghế đã chọn.` });
        if (assignedSeats.has(p.seat_id.toString())) return res.status(400).json({ success: false, message: `Lỗi trùng lặp: Ghế ${p.seat_id} đã bị gán.` });
        assignedSeats.add(p.seat_id.toString());
    }
    next();
};
