import axios from 'axios';
import { ApiResponse, SMS } from './types';

const API_BASE_URL = '/api/v1';

export const getAllSMS = async (): Promise<SMS[]> => {
  const response = await axios.get<ApiResponse>(`${API_BASE_URL}/sms`);

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch SMS messages');
  }

  return response.data.data;
};

export const getSMS = async (id: string): Promise<SMS> => {
  const response = await axios.get<ApiResponse>(`${API_BASE_URL}/sms/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch SMS');
  }

  return response.data.data;
};

export const deleteSMS = async (id: string): Promise<void> => {
  const response = await axios.delete<ApiResponse>(`${API_BASE_URL}/sms/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to delete SMS');
  }
};

export const deleteAllSMS = async (): Promise<void> => {
  const response = await axios.delete<ApiResponse>(`${API_BASE_URL}/sms`);

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to delete all SMS');
  }
};
