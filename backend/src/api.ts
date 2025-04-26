import { Router, Request, Response } from 'express';
import { smsStore } from './store';
import { ApiResponse } from './types';
import { getSMSAttributes } from './sns-mock';

const router = Router();

// Get all SMS messages
router.get('/sms', (req: Request, res: Response) => {
  try {
    const messages = smsStore.getAllSMS();
    const response: ApiResponse = {
      success: true,
      data: messages,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching SMS messages:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch SMS messages',
    };
    res.status(500).json(response);
  }
});

// Get a specific SMS message
router.get('/sms/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = smsStore.getSMS(id);

    if (!message) {
      const response: ApiResponse = {
        success: false,
        error: 'SMS not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: message,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching SMS message:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch SMS message',
    };
    res.status(500).json(response);
  }
});

// Delete a specific SMS message
router.delete('/sms/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = smsStore.deleteSMS(id);

    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: 'SMS not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
    };
    res.json(response);
  } catch (error) {
    console.error('Error deleting SMS message:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete SMS message',
    };
    res.status(500).json(response);
  }
});

// Delete all SMS messages
router.delete('/sms', (req: Request, res: Response) => {
  try {
    smsStore.deleteAllSMS();
    const response: ApiResponse = {
      success: true,
    };
    res.json(response);
  } catch (error) {
    console.error('Error deleting all SMS messages:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete all SMS messages',
    };
    res.status(500).json(response);
  }
});

// Get SMS attributes
router.get('/attributes', (req: Request, res: Response) => {
  try {
    const attributes = getSMSAttributes();
    const response: ApiResponse = {
      success: true,
      data: attributes,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching SMS attributes:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch SMS attributes',
    };
    res.status(500).json(response);
  }
});

export default router;
