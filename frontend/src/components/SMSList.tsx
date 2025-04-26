import { FC } from 'react';
import { SMS } from '../types';

interface SMSListProps {
  messages: SMS[];
  onSelect: (message: SMS) => void;
  selectedId: string | null;
}

const SMSList: FC<SMSListProps> = ({ messages, onSelect, selectedId }) => {
  if (messages.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
        No SMS messages yet. Use AWS SDK to send messages.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      <ul className="divide-y divide-gray-200">
        {messages.map((message) => (
          <li
            key={message.id}
            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
              selectedId === message.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSelect(message)}
          >
            <div className="flex justify-between">
              <span className="font-medium">{message.phoneNumber}</span>
              <span className="text-sm text-gray-500">
                {new Date(message.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-700 truncate">{message.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SMSList;
