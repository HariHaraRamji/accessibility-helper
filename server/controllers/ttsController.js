exports.logTTS = (req, res) => {
    const { text } = req.body;
    console.log(`TTS Request: "${text.substring(0, 50)}..."`);

    res.json({
        status: 'speaking',
        message: 'TTS activity logged on server'
    });
};
