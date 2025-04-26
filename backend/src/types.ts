export interface SMS {
  id: string;
  phoneNumber: string;
  message: string;
  timestamp: Date;
  messageAttributes?: Record<string, any>;
  metadata?: {
    requestId?: string;
    clientIp?: string;
    userAgent?: string;
    senderId?: string; // Add this property
    smsType?: string; // Add this property
  };
}

export interface SNSPublishParams {
  PhoneNumber: string;
  Message: string;
  MessageAttributes?: Record<string, any>;
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
