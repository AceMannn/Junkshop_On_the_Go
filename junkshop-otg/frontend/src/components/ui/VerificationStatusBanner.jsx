const STATUS_COPY = {
  draft: {
    title: 'Verification not submitted yet',
    body: 'Your junkshop is hidden from the public map. Upload your government ID, business permit, and shop photos, then submit for admin review.',
    className: 'border-amber-200 bg-amber-50/80 text-amber-950',
  },
  pending: {
    title: 'Verification pending',
    body: 'Your documents are waiting for admin review. You can still finish shop setup while you wait.',
    className: 'border-sky-200 bg-sky-50 text-sky-950',
  },
  rejected: {
    title: 'Verification needs updates',
    body: 'Admin rejected your application. Review the note, update your documents, and resubmit.',
    className: 'border-red-200 bg-red-50 text-red-900',
  },
};

export default function VerificationStatusBanner({ user, className = '', onGoVerification }) {
  const status = user?.verificationStatus;

  if (!status || status === 'approved') {
    return null;
  }

  const copy = STATUS_COPY[status] || STATUS_COPY.draft;

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${copy.className} ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base">{copy.title}</h3>
          <p className="mt-1 text-xs sm:text-sm opacity-90">{copy.body}</p>
          {status === 'rejected' && user?.verificationRejectNote && (
            <p className="mt-2 rounded-lg border border-red-200 bg-white/70 px-3 py-2 text-xs sm:text-sm">
              Admin note: {user.verificationRejectNote}
            </p>
          )}
        </div>
        {onGoVerification && (
          <button
            type="button"
            onClick={onGoVerification}
            className="shrink-0 rounded-lg bg-white/80 px-3 py-2 text-xs font-semibold shadow-sm hover:bg-white"
          >
            Open Verification Center
          </button>
        )}
      </div>
    </div>
  );
}
