const mongoose = require('mongoose');

const passengerDraftSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    trip_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    seats: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
    passengers: [{
        seat_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        passenger_name: { type: String, required: true },
        passenger_id_card: { type: String, required: true },
        date_of_birth: { type: Date },
        gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
        contact_info: {
            phone: { type: String, required: true },
            email: { type: String, required: true }
        },
        passenger_type: { type: String, enum: ['ADULT', 'CHILD', 'INFANT'], default: 'ADULT' },
        final_price: { type: Number, default: 0 }
    }],
    created_at: { type: Date, default: Date.now, index: { expires: '30m' } }
});

module.exports = mongoose.model('PassengerDraft', passengerDraftSchema);
