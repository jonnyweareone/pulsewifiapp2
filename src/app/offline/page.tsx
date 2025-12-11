'use client';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-2xl font-bold text-white mb-4">
          You&apos;re Offline
        </h1>
        <p className="text-gray-400 mb-8">
          It looks like you&apos;ve lost your internet connection. 
          Connect to WiFi or mobile data to continue using Pulse WiFi.
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
