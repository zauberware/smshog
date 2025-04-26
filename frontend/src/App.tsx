import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getAllSMS, deleteSMS, deleteAllSMS } from './api';
import SMSList from './components/SMSList';
import SMSDetail from './components/SMSDetail';
import { SMS } from './types';

function App() {
  const [selectedMessage, setSelectedMessage] = useState<SMS | null>(null);
  const queryClient = useQueryClient();

  const {
    data: messages,
    isLoading,
    error,
  } = useQuery('sms', getAllSMS, {
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const deleteMutation = useMutation((id: string) => deleteSMS(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('sms');
      setSelectedMessage(null);
    },
  });

  const deleteAllMutation = useMutation(deleteAllSMS, {
    onSuccess: () => {
      queryClient.invalidateQueries('sms');
      setSelectedMessage(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        Error loading messages: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">SMSHog</h1>
          <button
            onClick={() => deleteAllMutation.mutate()}
            disabled={deleteAllMutation.isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Delete All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col">
            <h2 className="text-lg font-medium mb-3">Messages</h2>
            <div className="h-[600px] overflow-y-auto">
              <SMSList
                messages={messages || []}
                onSelect={setSelectedMessage}
                selectedId={selectedMessage?.id || null}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-lg font-medium mb-3">Details</h2>
            <SMSDetail
              message={selectedMessage}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
