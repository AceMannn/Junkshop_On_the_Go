import { RefreshCw } from 'lucide-react';

export default function LoadErrorBanner({ message, onRetry, className = '' }) {
  if (!message) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-red-800 bg-red-50 border border-red-200 px-4 py-3 rounded-xl ${className}`}
      role="alert"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 font-semibold text-red-900 hover:underline shrink-0"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      )}
    </div>
  );
}
