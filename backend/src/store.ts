import { SMS } from './types';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

class SMSStore {
  private messages: Map<string, SMS>;
  private persistPath: string | null = null;
  private persistTimer: NodeJS.Timeout | null = null;
  private readonly persistInterval = 5000; // 5 seconds

  constructor() {
    this.messages = new Map();

    // Initialize persistence if enabled
    if (process.env.SMSHOG_PERSIST === 'true') {
      this.enablePersistence(
        process.env.SMSHOG_PERSIST_PATH || '/data/sms-store.json'
      );
    }
  }

  /**
   * Enable persistence of messages to disk
   */
  public enablePersistence(filePath: string): void {
    this.persistPath = filePath;
    console.log(
      `Persistence enabled. Data will be stored at: ${this.persistPath}`
    );

    // Create directory if it doesn't exist
    const dir = path.dirname(this.persistPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }

    // Load existing data if available
    this.loadFromDisk();

    // Setup periodic saving
    this.persistTimer = setInterval(
      () => this.saveToDisk(),
      this.persistInterval
    );
  }

  /**
   * Disable persistence
   */
  public disablePersistence(): void {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
    this.persistPath = null;
    console.log('Persistence disabled');
  }

  /**
   * Load messages from disk
   */
  private loadFromDisk(): void {
    if (!this.persistPath) return;

    try {
      if (fs.existsSync(this.persistPath)) {
        const data = fs.readFileSync(this.persistPath, 'utf8');
        const messages = JSON.parse(data) as SMS[];

        // Convert dates from strings back to Date objects
        messages.forEach((msg) => {
          msg.timestamp = new Date(msg.timestamp);
          this.messages.set(msg.id, msg);
        });

        console.log(`Loaded ${messages.length} messages from disk`);
      }
    } catch (error) {
      console.error('Error loading data from disk:', error);
    }
  }

  /**
   * Save messages to disk
   */
  private saveToDisk(): void {
    if (!this.persistPath) return;

    try {
      const data = JSON.stringify(Array.from(this.messages.values()), null, 2);
      fs.writeFileSync(this.persistPath, data, 'utf8');
    } catch (error) {
      console.error('Error saving data to disk:', error);
    }
  }

  addSMS(sms: Omit<SMS, 'id'>): SMS {
    const id = uuidv4();
    const newSMS: SMS = { ...sms, id };
    this.messages.set(id, newSMS);

    // Immediate save on new message
    if (this.persistPath) {
      this.saveToDisk();
    }

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
    const result = this.messages.delete(id);

    // Immediate save on delete
    if (result && this.persistPath) {
      this.saveToDisk();
    }

    return result;
  }

  deleteAllSMS(): void {
    this.messages.clear();

    // Immediate save on delete all
    if (this.persistPath) {
      this.saveToDisk();
    }
  }
}

// Singleton instance
export const smsStore = new SMSStore();
