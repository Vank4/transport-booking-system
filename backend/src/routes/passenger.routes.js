const express = require('express');
const router = express.Router();
const { saveDraftPassengerInfo, getDraftPassengerInfo, savePassengerInfo } = require('../controllers/passenger.controller');
const { validatePassengerData } = require('../middleware/passengerValidator');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, env.jwtSecret);
            req.user = decoded;
        } catch (error) {
            req.authError = 'Vui lòng đăng nhập để tiếp tục';
        }
    }
    next();
};

// Nếu có middleware Check Login, nhớ nhét vào giữa nhé
router.post('/draft', validatePassengerData, saveDraftPassengerInfo);
router.get('/draft/:draft_id', getDraftPassengerInfo);

// Save passenger info to existing booking (authenticated)
router.post('/:bookingId/passengers', optionalAuth, savePassengerInfo);

module.exports = router;
