import { Request, Response } from 'express';
import { smsStore } from './store';
import { MessageAttributeValue, SNSAttributes } from './types';
import { Builder } from 'xml2js';

// Store for SMS attributes
const smsAttributes: SNSAttributes = {
  DefaultSenderID: 'SMSHOG',
  DefaultSMSType: 'Transactional',
  UsageReportS3Bucket: '',
};

// XML builder instance
const xmlBuilder = new Builder({
  xmldec: { version: '1.0', encoding: 'utf-8' },
});

export function handleSNSRequest(req: Request, res: Response) {
  const action = req.query.Action || req.body.Action;

  // Determine response format - check for xml in Accept header or query parameters
  const wantsXml =
    req.headers['accept']?.includes('xml') ||
    req.query.format === 'xml' ||
    req.headers['content-type']?.includes('xml') ||
    !req.headers['accept']?.includes('json'); // Default to XML if JSON not explicitly requested

  // Set appropriate content type
  if (wantsXml) {
    res.setHeader('Content-Type', 'text/xml');
  } else {
    res.setHeader('Content-Type', 'application/json');
  }

  // Support multiple actions
  switch (action) {
    case 'Publish':
      return handlePublish(req, res, wantsXml);
    case 'SetSMSAttributes':
      return handleSetSMSAttributes(req, res, wantsXml);
    default:
      return sendResponse(
        res,
        {
          ErrorResponse: {
            Error: {
              Type: 'Sender',
              Code: 'InvalidAction',
              Message: `The action ${action} is not valid`,
            },
            RequestId: '00000000-0000-0000-0000-000000000000',
          },
        },
        400,
        wantsXml
      );
  }
}

function handlePublish(req: Request, res: Response, useXml: boolean) {
  try {
    // Extract parameters either from query or body
    const input: Record<string, unknown> = { ...req.query, ...req.body };
    const phoneNumber = input.PhoneNumber;
    const message = input.Message;

    // Validate required parameters
    if (
      typeof phoneNumber !== 'string' ||
      typeof message !== 'string' ||
      !phoneNumber ||
      !message
    ) {
      return sendResponse(
        res,
        {
          ErrorResponse: {
            Error: {
              Type: 'Sender',
              Code: 'InvalidParameter',
              Message:
                'PhoneNumber and Message are required and must be strings',
            },
            RequestId: '00000000-0000-0000-0000-000000000000',
          },
        },
        400,
        useXml
      );
    }

    const messageAttributes = parseMessageAttributes(input);

    // Store the SMS. Per-message attributes win over the account defaults,
    // as they do on AWS.
    const sms = smsStore.addSMS({
      phoneNumber,
      message,
      messageAttributes,
      timestamp: new Date(),
      metadata: {
        requestId: '00000000-0000-0000-0000-000000000000',
        clientIp: req.ip,
        userAgent: req.get('user-agent'),
        smsType:
          messageAttributes?.['AWS.SNS.SMS.SMSType']?.StringValue ||
          smsAttributes.DefaultSMSType,
        senderId:
          messageAttributes?.['AWS.SNS.SMS.SenderID']?.StringValue ||
          smsAttributes.DefaultSenderID,
      },
    });

    // Return a successful SNS-like response
    return sendResponse(
      res,
      {
        PublishResponse: {
          PublishResult: {
            MessageId: sms.id,
          },
          ResponseMetadata: {
            RequestId: '00000000-0000-0000-0000-000000000000',
          },
        },
      },
      200,
      useXml
    );
  } catch (error) {
    console.error('Error processing SNS Publish request:', error);
    return sendResponse(
      res,
      {
        ErrorResponse: {
          Error: {
            Type: 'Receiver',
            Code: 'InternalFailure',
            Message:
              'The request processing failed because of an unknown error',
          },
          RequestId: '00000000-0000-0000-0000-000000000000',
        },
      },
      500,
      useXml
    );
  }
}

function handleSetSMSAttributes(req: Request, res: Response, useXml: boolean) {
  try {
    // Process attributes from the format:
    // attributes.entry.1.key, attributes.entry.1.value, etc.
    const body = req.body;

    // Find all attribute keys in the request and update the known ones
    Object.keys(body).forEach((key) => {
      if (key.startsWith('attributes.entry.') && key.endsWith('.key')) {
        const entryNum = key.split('.')[2];
        const attrKey = body[key];
        const attrValue = body[`attributes.entry.${entryNum}.value`];

        if (
          typeof attrKey === 'string' &&
          typeof attrValue === 'string' &&
          Object.prototype.hasOwnProperty.call(smsAttributes, attrKey)
        ) {
          smsAttributes[attrKey] = attrValue;
        }
      }
    });

    console.log('Updated SMS attributes:', smsAttributes);

    // Return successful response
    return sendResponse(
      res,
      {
        SetSMSAttributesResponse: {
          ResponseMetadata: {
            RequestId: '00000000-0000-0000-0000-000000000000',
          },
        },
      },
      200,
      useXml
    );
  } catch (error) {
    console.error('Error processing SetSMSAttributes request:', error);
    return sendResponse(
      res,
      {
        ErrorResponse: {
          Error: {
            Type: 'Receiver',
            Code: 'InternalFailure',
            Message:
              'The request processing failed because of an unknown error',
          },
          RequestId: '00000000-0000-0000-0000-000000000000',
        },
      },
      500,
      useXml
    );
  }
}

/**
 * Collect message attributes. The AWS SDKs send them in the flattened query
 * protocol (MessageAttributes.entry.N.Name / .Value.DataType / ...); a nested
 * MessageAttributes object is accepted as well for hand-written JSON requests.
 */
function parseMessageAttributes(
  input: Record<string, unknown>
): Record<string, MessageAttributeValue> | undefined {
  const attributes: Record<string, MessageAttributeValue> = Object.create(null);

  const nested = input.MessageAttributes;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    for (const [name, value] of Object.entries(nested)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        attributes[name] = pickAttributeValue(value as Record<string, unknown>);
      }
    }
  }

  const prefix = 'MessageAttributes.entry.';
  for (const key of Object.keys(input)) {
    if (!key.startsWith(prefix) || !key.endsWith('.Name')) continue;

    const entry = key.slice(0, -'.Name'.length);
    const name = input[key];
    if (typeof name !== 'string' || !name) continue;

    attributes[name] = pickAttributeValue({
      DataType: input[`${entry}.Value.DataType`],
      StringValue: input[`${entry}.Value.StringValue`],
      BinaryValue: input[`${entry}.Value.BinaryValue`],
    });
  }

  return Object.keys(attributes).length > 0 ? { ...attributes } : undefined;
}

function pickAttributeValue(
  value: Record<string, unknown>
): MessageAttributeValue {
  const result: MessageAttributeValue = {};
  for (const field of ['DataType', 'StringValue', 'BinaryValue'] as const) {
    const fieldValue = value[field];
    if (typeof fieldValue === 'string') {
      result[field] = fieldValue;
    }
  }
  return result;
}

// Helper function to send either XML or JSON response
function sendResponse(
  res: Response,
  data: any,
  statusCode: number,
  useXml: boolean
) {
  if (useXml) {
    // Convert JSON to XML and send
    try {
      // Fix for "@xmlns" syntax which isn't valid for xmlbuilder
      const cleanData = cleanXmlData(data);

      // Build the XML
      const xml = xmlBuilder.buildObject(cleanData);

      // Add namespace manually if needed
      let finalXml = xml;
      if (xml.includes('<PublishResponse>')) {
        finalXml = xml.replace(
          '<PublishResponse>',
          '<PublishResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">'
        );
      } else if (xml.includes('<SetSMSAttributesResponse>')) {
        finalXml = xml.replace(
          '<SetSMSAttributesResponse>',
          '<SetSMSAttributesResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">'
        );
      } else if (xml.includes('<ErrorResponse>')) {
        finalXml = xml.replace(
          '<ErrorResponse>',
          '<ErrorResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">'
        );
      }

      return res.status(statusCode).send(finalXml);
    } catch (error) {
      console.error('Error converting to XML:', error);
      // Fallback to text response in case of XML conversion error
      return res
        .status(500)
        .set('Content-Type', 'text/plain')
        .send(
          'Error generating XML response. Error: ' + (error as Error).message
        );
    }
  } else {
    // Send JSON response
    return res.status(statusCode).json(data);
  }
}

// Helper function to clean the data structure for XML
function cleanXmlData(data: any): any {
  // If it's an array or null, return as is
  if (Array.isArray(data) || data === null || data === undefined) {
    return data;
  }

  // If it's not an object, return as is (string, number, etc)
  if (typeof data !== 'object') {
    return data;
  }

  // Create a new object to hold clean data
  const cleanObj: any = {};

  // Process each property
  for (const [key, value] of Object.entries(data)) {
    // Skip '@xmlns' as we'll add it manually
    if (key === '@xmlns') continue;

    // Make a clean key without '@' or special characters
    const cleanKey = key.startsWith('@') ? key.substring(1) : key;

    // Recursively clean nested objects
    cleanObj[cleanKey] = cleanXmlData(value);
  }

  return cleanObj;
}

// Export for testing and API access
export function getSMSAttributes(): SNSAttributes {
  return { ...smsAttributes };
}
