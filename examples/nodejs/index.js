import {
  SNSClient,
  PublishCommand,
  SetSMSAttributesCommand,
} from '@aws-sdk/client-sns';

// Configure the SNS client to use the local SMSHog server
const snsClient = new SNSClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8080', // SMSHog endpoint
  credentials: {
    accessKeyId: 'dummy-access-key',
    secretAccessKey: 'dummy-secret-key',
  },
});

// Send an SMS
async function sendSMS() {
  const params = {
    Message: 'Hello from Javascript!',
    PhoneNumber: '+491234567890', // Replace with the recipient's phone number
  };

  try {
    await snsClient.send(
      new SetSMSAttributesCommand({
        attributes: {
          DefaultSenderID: 'MySenderId',
          DefaultSMSType: 'Transactional',
          UsageReportS3Bucket: 'my-s3-bucket',
        },
      })
    );
    const data = await snsClient.send(new PublishCommand(params));
    console.log('Success! Message ID:', data.MessageId);
  } catch (err) {
    console.error('Error sending message:', err);
  }
}

sendSMS();
