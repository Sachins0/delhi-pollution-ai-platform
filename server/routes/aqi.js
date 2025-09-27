const express = require('express');
const router = express.Router();
const aqiController = require('../controllers/aqiController');

router.get('/', aqiController.getLatest);
router.post('/', aqiController.create);

module.exports = router;
