# SMSHog: AWS SNS SMS Mock and Display Tool

SMSHog mocks the AWS SNS SMS API, allowing clients (using aws-sdk v3) to send SMS via the SNS Publish route to SMSHog. The mock API stores these SMS messages and displays them through a MailHog-like web interface.

## Features

- Mock AWS SNS SMS API with support for the Publish action
- Capture and display SMS messages sent to the mock service
- Web UI to view and manage received messages
- Delete individual or all SMS messages
- Docker support for easy setup and deployment

## Getting Started

### Prerequisites

- Docker and docker-compose installed

### Running SMSHog

1. Clone this repository:

```bash
git clone <repository-url>
cd smshog
```

2. Start the application:

```bash
docker-compose up
```

3. Access the web UI at http://localhost:8080

### Development Mode

For development with hot-reloading:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Using with AWS SDK

Example of how to use SMSHog with the AWS SDK v3:

```javascript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Configure the SNS client to use the local SMSHog server
const snsClient = new SNSClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:3000',
  credentials: {
    accessKeyId: 'dummy-access-key',
    secretAccessKey: 'dummy-secret-key',
  },
});

// Send an SMS
async function sendSMS() {
  const params = {
    Message: 'Hello from SMSHog!',
    PhoneNumber: '+1234567890',
  };

  try {
    const data = await snsClient.send(new PublishCommand(params));
    console.log('Success! Message ID:', data.MessageId);
  } catch (err) {
    console.error('Error sending message:', err);
  }
}

sendSMS();
```

## API Endpoints

### SNS Mock API

- `POST /` or `POST /sms` - Handle SNS Publish requests

### REST API

- `GET /api/v1/sms` - Get all SMS messages
- `GET /api/v1/sms/:id` - Get a specific SMS message
- `DELETE /api/v1/sms/:id` - Delete a specific SMS message
- `DELETE /api/v1/sms` - Delete all SMS messages

## Architecture

SMSHog consists of two main components:

1. **Backend**: Node.js/Express server with TypeScript that implements the AWS SNS mock API
2. **Frontend**: React with TypeScript and Vite for displaying and managing SMS messages

## License

MIT
