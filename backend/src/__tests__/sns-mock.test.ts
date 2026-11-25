import request from 'supertest';
import { createApp } from '../app';
import { smsStore } from '../store';

const app = createApp();

function publish(fields: Record<string, string>) {
  return request(app)
    .post('/')
    .type('form')
    .send({ Action: 'Publish', ...fields });
}

beforeEach(() => {
  smsStore.deleteAllSMS();
});

describe('Publish', () => {
  it('stores the message and answers with SNS XML', async () => {
    const res = await publish({ PhoneNumber: '+491234', Message: 'hi' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/xml');
    expect(res.text).toContain(
      '<PublishResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">'
    );

    const [sms] = smsStore.getAllSMS();
    expect(sms.phoneNumber).toBe('+491234');
    expect(sms.message).toBe('hi');
    expect(res.text).toContain(`<MessageId>${sms.id}</MessageId>`);
  });

  it('answers with JSON when asked to', async () => {
    const res = await publish({ PhoneNumber: '+491234', Message: 'hi' }).set(
      'Accept',
      'application/json'
    );

    expect(res.body.PublishResponse.PublishResult.MessageId).toBe(
      smsStore.getAllSMS()[0].id
    );
  });

  it('reads message attributes in the format the AWS SDKs send', async () => {
    await publish({
      PhoneNumber: '+491234',
      Message: 'hi',
      'MessageAttributes.entry.1.Name': 'AWS.SNS.SMS.SenderID',
      'MessageAttributes.entry.1.Value.DataType': 'String',
      'MessageAttributes.entry.1.Value.StringValue': 'ACME',
      'MessageAttributes.entry.2.Name': 'AWS.SNS.SMS.SMSType',
      'MessageAttributes.entry.2.Value.DataType': 'String',
      'MessageAttributes.entry.2.Value.StringValue': 'Promotional',
    });

    const [sms] = smsStore.getAllSMS();
    expect(sms.messageAttributes).toEqual({
      'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: 'ACME' },
      'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Promotional' },
    });
    expect(sms.metadata?.senderId).toBe('ACME');
    expect(sms.metadata?.smsType).toBe('Promotional');
  });

  it('rejects missing parameters', async () => {
    const res = await publish({ PhoneNumber: '+491234' });

    expect(res.status).toBe(400);
    expect(res.text).toContain('<Code>InvalidParameter</Code>');
    expect(smsStore.getAllSMS()).toHaveLength(0);
  });

  it('rejects parameters that are not strings', async () => {
    const res = await request(app)
      .post('/')
      .set('Accept', 'application/json')
      .send({ Action: 'Publish', PhoneNumber: { a: 1 }, Message: ['x'] });

    expect(res.status).toBe(400);
    expect(smsStore.getAllSMS()).toHaveLength(0);
  });
});

describe('SetSMSAttributes', () => {
  it('updates known attributes and ignores everything else', async () => {
    const res = await request(app).post('/').type('form').send({
      Action: 'SetSMSAttributes',
      'attributes.entry.1.key': 'DefaultSenderID',
      'attributes.entry.1.value': 'MySender',
      'attributes.entry.2.key': 'toString',
      'attributes.entry.2.value': 'pwn',
      'attributes.entry.3.key': 'Unknown',
      'attributes.entry.3.value': 'x',
    });
    expect(res.status).toBe(200);

    const attributes = await request(app).get('/api/v1/attributes');
    expect(attributes.body.data).toEqual({
      DefaultSenderID: 'MySender',
      DefaultSMSType: 'Transactional',
      UsageReportS3Bucket: '',
    });

    await publish({ PhoneNumber: '+491234', Message: 'hi' });
    expect(smsStore.getAllSMS()[0].metadata?.senderId).toBe('MySender');
  });
});

describe('unknown actions', () => {
  it('answers with InvalidAction', async () => {
    const res = await request(app)
      .post('/')
      .type('form')
      .send({ Action: 'CreateTopic' });

    expect(res.status).toBe(400);
    expect(res.text).toContain('<Code>InvalidAction</Code>');
  });
});

describe('REST API', () => {
  it('lists, fetches and deletes messages', async () => {
    await publish({ PhoneNumber: '+491', Message: 'one' });
    await publish({ PhoneNumber: '+492', Message: 'two' });

    const list = await request(app).get('/api/v1/sms');
    expect(list.body.data).toHaveLength(2);

    const id = list.body.data[0].id;
    const single = await request(app).get(`/api/v1/sms/${id}`);
    expect(single.body.data.id).toBe(id);

    expect((await request(app).delete(`/api/v1/sms/${id}`)).status).toBe(200);
    expect((await request(app).delete(`/api/v1/sms/${id}`)).status).toBe(404);

    await request(app).delete('/api/v1/sms');
    expect(smsStore.getAllSMS()).toHaveLength(0);
  });

  it('reports health', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.body).toEqual({ status: 'ok' });
  });
});
