import { createApp } from './app';

// Fixed on purpose: nginx and the Vite dev proxy both expect the backend on
// 3000, and the PORT variable from .env is the *host* port of the container.
const PORT = 3000;

createApp().listen(PORT, () => {
  console.log(`SMSHog server running on port ${PORT}`);
});
