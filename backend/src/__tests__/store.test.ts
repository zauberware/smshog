import fs from 'fs';
import os from 'os';
import path from 'path';
import { SMSStore } from '../store';

let dir: string;
let file: string;

function sms(message: string) {
  return { phoneNumber: '+491234', message, timestamp: new Date() };
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smshog-'));
  file = path.join(dir, 'nested', 'sms-store.json');
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('SMSStore', () => {
  it('persists messages and loads them again', () => {
    const first = new SMSStore();
    first.enablePersistence(file);
    const saved = first.addSMS(sms('hello'));

    const second = new SMSStore();
    second.enablePersistence(file);

    const loaded = second.getSMS(saved.id);
    expect(loaded?.message).toBe('hello');
    expect(loaded?.timestamp).toBeInstanceOf(Date);
    expect(fs.existsSync(`${file}.tmp`)).toBe(false);
  });

  it('keeps an unreadable store file instead of overwriting it', () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '{broken');

    const store = new SMSStore();
    store.enablePersistence(file);
    store.addSMS(sms('new'));

    const backups = fs
      .readdirSync(path.dirname(file))
      .filter((name) => name.includes('.corrupt-'));
    expect(backups).toHaveLength(1);
    expect(
      fs.readFileSync(path.join(path.dirname(file), backups[0]), 'utf8')
    ).toBe('{broken');
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toHaveLength(1);
  });

  it('drops the oldest messages once the limit is reached', () => {
    const store = new SMSStore(2);
    store.addSMS(sms('one'));
    store.addSMS(sms('two'));
    store.addSMS(sms('three'));

    const messages = store.getAllSMS().map((m) => m.message);
    expect(messages).toHaveLength(2);
    expect(messages).not.toContain('one');
  });

  it('keeps everything when no limit is set', () => {
    const store = new SMSStore(Number(undefined));
    for (let i = 0; i < 50; i++) store.addSMS(sms(`m${i}`));

    expect(store.getAllSMS()).toHaveLength(50);
  });
});
