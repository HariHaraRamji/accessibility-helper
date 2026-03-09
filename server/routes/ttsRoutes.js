const express = require('express');
const router = express.Router();
const ttsController = require('../controllers/ttsController');

router.post('/text-to-speech', ttsController.logTTS);

module.exports = router;
