import { SMS } from './types';
import { v4 as uuidv4 } from 'uuid';

class SMSStore {
  private messages: Map<string, SMS>;

  constructor() {
    this.messages = new Map();
  }

  addSMS(sms: Omit<SMS, 'id'>): SMS {
    const id = uuidv4();
    const newSMS: SMS = { ...sms, id };
    this.messages.set(id, newSMS);
    return newSMS;
  }

  getSMS(id: string): SMS | undefined {
    return this.messages.get(id);
  }

  getAllSMS(): SMS[] {
    return Array.from(this.messages.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  deleteSMS(id: string): boolean {
    return this.messages.delete(id);
  }

  deleteAllSMS(): void {
    this.messages.clear();
  }
}

// Singleton instance
export const smsStore = new SMSStore();
