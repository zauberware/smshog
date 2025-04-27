import { FC } from 'react';
import { SMS } from '../types';

interface SMSDetailProps {
  message: SMS | null;
  onDelete: (id: string) => void;
}

const SMSDetail: FC<SMSDetailProps> = ({ message, onDelete }) => {
  if (!message) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
        Select a message to view details
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium">Message Details</h2>
        <button
          onClick={() => onDelete(message.id)}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">
            Recipient Phone Number
          </h3>
          <p className="mt-1">{message.phoneNumber}</p>
        </div>

        {message.metadata?.senderId && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500">Sender</h3>
            <p className="mt-1 font-semibold">{message.metadata.senderId}</p>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
          <p className="mt-1">{new Date(message.timestamp).toLocaleString()}</p>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Message</h3>
          <div className="mt-1 bg-gray-50 p-3 rounded whitespace-pre-wrap">
            {message.message}
          </div>
        </div>

        {message.messageAttributes &&
          Object.keys(message.messageAttributes).length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Message Attributes
              </h3>
              <div className="mt-1 bg-gray-50 p-3 rounded">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(message.messageAttributes, null, 2)}
                </pre>
              </div>
            </div>
          )}

        {message.metadata && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Metadata</h3>
            <div className="mt-1 bg-gray-50 p-3 rounded">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(message.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSDetail;
