import express from 'express';
import cors from 'cors';
import { handleSNSRequest } from './sns-mock';
import apiRoutes from './api';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SNS Mock endpoints
app.post('/', handleSNSRequest);
app.post('/sms', handleSNSRequest);
app.get('/', handleSNSRequest); // Supporting GET for easy testing

// API routes
app.use('/api/v1', apiRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`SMSHog server running on port ${PORT}`);
});
