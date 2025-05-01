import {
  SNSClient,
  PublishCommand,
  SetSMSAttributesCommand,
  PublishCommandOutput,
  SetSMSAttributesCommandOutput,
} from '@aws-sdk/client-sns';

// Configure the SNS client to use the local SMSHog server
const snsClient = new SNSClient({
  region: 'us-east-1',
  endpoint: 'https://localhost:8080', // SMSHog endpoint
  credentials: {
    accessKeyId: 'dummy-access-key',
    secretAccessKey: 'dummy-secret-key',
  },
});

// Send an SMS
async function sendSMS(): Promise<void> {
  const params = {
    Message: 'Hello from TypeScript!',
    PhoneNumber: '+491234567890', // Replace with the recipient's phone number
  };

  try {
    const attributesResponse: SetSMSAttributesCommandOutput =
      await snsClient.send(
        new SetSMSAttributesCommand({
          attributes: {
            DefaultSenderID: 'MySenderId',
            DefaultSMSType: 'Transactional',
            UsageReportS3Bucket: 'my-s3-bucket',
          },
        })
      );

    const data: PublishCommandOutput = await snsClient.send(
      new PublishCommand(params)
    );
    console.log('Success! Message ID:', data.MessageId);
  } catch (err: unknown) {
    console.error(
      'Error sending message:',
      err instanceof Error ? err.message : err
    );
  }
}

// Execute the function
sendSMS().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
