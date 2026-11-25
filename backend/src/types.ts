export interface SMS {
  id: string;
  phoneNumber: string;
  message: string;
  timestamp: Date;
  messageAttributes?: Record<string, MessageAttributeValue>;
  metadata?: {
    requestId?: string;
    clientIp?: string;
    userAgent?: string;
    senderId?: string;
    smsType?: string;
  };
}

export interface MessageAttributeValue {
  DataType?: string;
  StringValue?: string;
  BinaryValue?: string;
}

export interface SNSAttributes {
  DefaultSenderID: string;
  DefaultSMSType: string;
  UsageReportS3Bucket: string;
  [key: string]: string; // Allow other attributes
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}
