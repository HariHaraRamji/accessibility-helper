const express = require('express');
const router = express.Router();

let notes = []; // In-memory storage

// POST /api/notes
router.post('/notes', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const newNote = {
        id: Date.now(),
        text,
        createdAt: new Date().toISOString()
    };

    notes.unshift(newNote); // Add to the beginning
    console.log(`Note saved: "${text.substring(0, 50)}..."`);

    res.json({ success: true, note: newNote });
});

// POST /api/text-to-speech
router.post('/text-to-speech', (req, res) => {
    const { text } = req.body;
    console.log(`[TTS Sync] Logging synthesis request for: "${text?.substring(0, 50)}..."`);
    res.json({ success: true, message: 'Speech synthesis logged' });
});

module.exports = router;
