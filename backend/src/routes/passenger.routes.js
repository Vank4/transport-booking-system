const express = require('express');
const router = express.Router();
const { saveDraftPassengerInfo, getDraftPassengerInfo } = require('../controllers/passenger.controller');
const { validatePassengerData } = require('../middleware/passengerValidator');

// Nếu có middleware Check Login, nhớ nhét vào giữa nhé
router.post('/draft', validatePassengerData, saveDraftPassengerInfo);
router.get('/draft/:draft_id', getDraftPassengerInfo);

module.exports = router;
