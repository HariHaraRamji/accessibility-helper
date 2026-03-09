const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import Routes
const ttsRoutes = require('./routes/ttsRoutes');

// Use Routes
app.use('/api', ttsRoutes);

// Basic health check
app.get('/', (req, res) => {
    res.send('AccessHelper Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
