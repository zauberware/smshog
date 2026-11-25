import express from 'express';
import cors from 'cors';
import { handleSNSRequest } from './sns-mock';
import apiRoutes from './api';
import { handleHealthCheck } from './health';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // SNS Mock endpoints
  app.post('/', handleSNSRequest);
  app.post('/sms', handleSNSRequest);
  app.get('/', handleSNSRequest); // Supporting GET for easy testing

  // Health check endpoint
  app.get('/health', handleHealthCheck);

  // API routes
  app.use('/api/v1', apiRoutes);

  return app;
}
