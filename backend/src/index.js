const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.get('/api/v1/sms', (req, res) => {
  // Return an empty array for now
  res.json({
    success: true,
    data: [],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`SMSHog server running on port ${PORT}`);
});
