const PassengerDraft = require('../models/passengerDrafts.model');

exports.saveDraftPassengerInfo = async (req, res) => {
    try {
        const { trip_id, seats, passengers } = req.body;
        let userId = req.user ? req.user._id : null;
        const draft = await PassengerDraft.create({ user_id: userId, trip_id, seats, passengers });
        res.status(201).json({ success: true, data: draft, message: 'Đã lưu bản nháp' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', detail: error.message });
    }
};

exports.getDraftPassengerInfo = async (req, res) => {
    try {
        const draft = await PassengerDraft.findById(req.params.draft_id);
        if (!draft) return res.status(404).json({ success: false, message: 'Bản nháp hết hạn' });
        res.status(200).json({ success: true, data: draft });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
