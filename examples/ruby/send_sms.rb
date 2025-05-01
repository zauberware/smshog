# frozen_string_literal: true

require 'aws-sdk-sns'

# Configure the SNS client to use the SMSHog server
sns = Aws::SNS::Client.new(
  region: 'us-east-1',
  endpoint: 'http://smshog.irrenzentrale.de',
  credentials: Aws::Credentials.new(
    'dummy-access-key',
    'dummy-secret-key'
  )
)

# Set SMS attributes (sender ID, etc.)
begin
  sns.set_sms_attributes({
                           attributes: {
                             'DefaultSenderID' => 'RubySender',
                             'DefaultSMSType' => 'Transactional',
                             'UsageReportS3Bucket' => 'my-bucket'
                           }
                         })
  puts 'SMS attributes set successfully'
rescue Aws::SNS::Errors::ServiceError => e
  puts "Error setting SMS attributes: #{e.message}"
end

# Send an SMS message
begin
  response = sns.publish({
                           phone_number: '+491234567890', # Replace with the recipient's phone number
                           message: 'Hello from Ruby!'
                         })

  puts "SMS sent successfully! Message ID: #{response.message_id}"
rescue Aws::SNS::Errors::ServiceError => e
  puts "Error sending SMS: #{e.message}"
end
