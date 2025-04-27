export interface SMS {
  id: string;
  phoneNumber: string;
  message: string;
  timestamp: string;
  messageAttributes?: Record<string, any>;
  metadata?: {
    requestId?: string;
    clientIp?: string;
    userAgent?: string;
    senderId?: string;
  };
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}
