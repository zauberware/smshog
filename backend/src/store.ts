import { SMS } from './types';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export class SMSStore {
  // Insertion order is oldest first, which is what the size cap relies on
  private messages: Map<string, SMS>;
  private persistPath: string | null = null;
  private maxMessages: number;

  constructor(maxMessages = 0) {
    this.messages = new Map();
    this.maxMessages = maxMessages > 0 ? Math.floor(maxMessages) : 0;
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
  }

  /**
   * Disable persistence
   */
  public disablePersistence(): void {
    this.persistPath = null;
    console.log('Persistence disabled');
  }

  /**
   * Load messages from disk. A file that cannot be read as a message list is
   * moved aside instead of being overwritten by the next save.
   */
  private loadFromDisk(): void {
    if (!this.persistPath || !fs.existsSync(this.persistPath)) return;

    try {
      const data = fs.readFileSync(this.persistPath, 'utf8');
      const messages: unknown = JSON.parse(data);
      if (!Array.isArray(messages)) {
        throw new Error('Store file does not contain a list of messages');
      }

      let loaded = 0;
      for (const msg of messages as SMS[]) {
        const timestamp = new Date(msg?.timestamp);
        if (typeof msg?.id !== 'string' || isNaN(timestamp.getTime())) {
          continue;
        }
        // Convert dates from strings back to Date objects
        this.messages.set(msg.id, { ...msg, timestamp });
        loaded++;
      }
      this.enforceLimit();

      console.log(`Loaded ${loaded} messages from disk`);
    } catch (error) {
      console.error('Error loading data from disk:', error);
      const backupPath = `${this.persistPath}.corrupt-${Date.now()}`;
      try {
        fs.renameSync(this.persistPath, backupPath);
        console.error(`Unreadable store file kept as: ${backupPath}`);
      } catch (renameError) {
        console.error('Could not move unreadable store file:', renameError);
      }
    }
  }

  /**
   * Save messages to disk. Writes a temporary file first so that a crash
   * mid-write cannot leave a truncated store behind.
   */
  private saveToDisk(): void {
    if (!this.persistPath) return;

    try {
      const data = JSON.stringify(Array.from(this.messages.values()), null, 2);
      const tmpPath = `${this.persistPath}.tmp`;
      fs.writeFileSync(tmpPath, data, 'utf8');
      fs.renameSync(tmpPath, this.persistPath);
    } catch (error) {
      console.error('Error saving data to disk:', error);
    }
  }

  private enforceLimit(): void {
    if (!this.maxMessages) return;

    for (const id of this.messages.keys()) {
      if (this.messages.size <= this.maxMessages) break;
      this.messages.delete(id);
    }
  }

  addSMS(sms: Omit<SMS, 'id'>): SMS {
    const id = randomUUID();
    const newSMS: SMS = { ...sms, id };
    this.messages.set(id, newSMS);
    this.enforceLimit();
    this.saveToDisk();

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
    if (result) {
      this.saveToDisk();
    }

    return result;
  }

  deleteAllSMS(): void {
    this.messages.clear();
    this.saveToDisk();
  }
}

// Singleton instance
export const smsStore = new SMSStore(Number(process.env.SMSHOG_MAX_MESSAGES));

if (process.env.SMSHOG_PERSIST === 'true') {
  smsStore.enablePersistence(
    process.env.SMSHOG_PERSIST_PATH || '/data/sms-store.json'
  );
}
