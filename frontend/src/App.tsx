import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllSMS, deleteSMS, deleteAllSMS } from './api';
import SMSList from './components/SMSList';
import SMSDetail from './components/SMSDetail';

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: messages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sms'],
    queryFn: getAllSMS,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const onDeleted = () => {
    setSelectedId(null);
    return queryClient.invalidateQueries({ queryKey: ['sms'] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteSMS,
    onSuccess: onDeleted,
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllSMS,
    onSuccess: onDeleted,
  });

  // Derived from the polled list, so a message that was deleted elsewhere
  // disappears from the detail view as well
  const selectedMessage =
    messages?.find((message) => message.id === selectedId) ?? null;
  const deleteError = deleteMutation.error ?? deleteAllMutation.error;

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
            disabled={deleteAllMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Delete All
          </button>
        </div>

        {deleteError && (
          <div
            role="alert"
            className="mb-6 px-4 py-3 rounded bg-red-50 text-red-800 border border-red-200"
          >
            Could not delete: {deleteError.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col h-full">
            <h2 className="text-lg font-medium mb-3">Messages</h2>
            <div
              className="overflow-auto flex-1"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              <SMSList
                messages={messages || []}
                onSelect={(message) => setSelectedId(message.id)}
                selectedId={selectedId}
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
