import { useCallback, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { superAdminApi } from '../services/api';
import VerificationDocumentImage from './VerificationDocumentImage';
import { formatDate, formatShortDate, shortAppId, statusPillClass } from '../utils/format';
import {
  superCardClass,
  superInputClass,
  superPrimaryButtonClass,
  superSecondaryButtonClass,
} from '../utils/superAdminUi';

const docTabs = [
  { id: 'government-id', label: 'Government ID' },
  { id: 'business-permit', label: 'Business permit' },
  { id: 'shop-photos', label: 'Shop photos' },
];

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#191c1c]">{value || '—'}</p>
    </div>
  );
}

export default function ApplicationReviewDrawer({ applicationId, onClose, onUpdated }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [application, setApplication] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState('government-id');

  const loadApplication = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setError('');
    try {
      const data = await superAdminApi.getApplication(applicationId);
      setApplication(data.application);
    } catch (err) {
      setError(err.message || 'Could not load application.');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!applicationId) return null;

  const docs = application?.verification?.documents;
  const canDecide = application?.verificationStatus === 'pending';
  const canModerate = application && !canDecide;

  const handleApprove = async () => {
    setActionLoading(true);
    setError('');
    try {
      await superAdminApi.approveApplication(applicationId);
      onUpdated?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not approve application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      setError('Enter a rejection note for the owner.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await superAdminApi.rejectApplication(applicationId, rejectNote.trim());
      onUpdated?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not reject application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReVerification = async () => {
    setActionLoading(true);
    setError('');
    try {
      const { application: updated } = await superAdminApi.requestReVerification(
        applicationId,
        rejectNote.trim()
      );
      setApplication(updated);
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Could not request re-verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHardReset = async () => {
    const confirmed = window.confirm(
      'Clear all verification documents for this provider? Previous files stay in admin audit only.'
    );
    if (!confirmed) return;

    setActionLoading(true);
    setError('');
    try {
      const { application: updated } = await superAdminApi.hardResetVerification(
        applicationId,
        rejectNote.trim()
      );
      setApplication(updated);
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Could not reset verification.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 transition-opacity"
        aria-label="Close review panel"
        onClick={onClose}
      />

      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <p className="text-xs font-mono text-zinc-500">{shortAppId(applicationId)}</p>
            <h2 className="text-lg font-bold text-[#191c1c]">Application Review</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-zinc-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading application...
            </div>
          ) : !application ? (
            <p className="text-red-700">{error || 'Application not found.'}</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-[#191c1c]">{application.junkshopName}</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Submitted {formatShortDate(application.verificationSubmittedAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusPillClass(
                    application.verificationStatus
                  )}`}
                >
                  {application.verificationStatus}
                </span>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              {application.verificationRejectNote && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <p className="font-semibold">Latest admin note</p>
                  <p className="mt-1 whitespace-pre-wrap">{application.verificationRejectNote}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Owner name" value={application.ownerName} />
                <InfoRow label="Contact email" value={application.email} />
                <InfoRow label="Phone" value={application.phone} />
                <InfoRow label="Location" value={application.address} />
                <InfoRow label="Reviewed" value={formatDate(application.verificationReviewedAt)} />
                <InfoRow
                  label="Shop published"
                  value={application.shop?.isPublished ? 'Yes' : 'No'}
                />
              </div>

              <section className={`${superCardClass} space-y-4 p-4`}>
                <h4 className="text-sm font-bold text-[#191c1c]">Verification documents</h4>
                <div className="flex flex-wrap gap-2 border-b border-zinc-100 pb-3">
                  {docTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveDocTab(tab.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        activeDocTab === tab.id
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeDocTab === 'government-id' && (
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-600">
                      Type: {docs?.governmentId?.docType || 'Not selected'}
                    </p>
                    {docs?.governmentId?.hasFile ? (
                      <VerificationDocumentImage
                        applicationId={applicationId}
                        kind="government-id"
                        alt="Government ID"
                      />
                    ) : (
                      <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-400">
                        Not uploaded
                      </div>
                    )}
                  </div>
                )}

                {activeDocTab === 'business-permit' && (
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-600">
                      Type: {docs?.businessPermit?.docType || 'Not selected'}
                    </p>
                    {docs?.businessPermit?.hasFile ? (
                      <VerificationDocumentImage
                        applicationId={applicationId}
                        kind="business-permit"
                        alt="Business permit"
                      />
                    ) : (
                      <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-400">
                        Not uploaded
                      </div>
                    )}
                  </div>
                )}

                {activeDocTab === 'shop-photos' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(docs?.shopPhotos || []).length === 0 ? (
                      <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-400">
                        No shop photos uploaded
                      </div>
                    ) : (
                      docs.shopPhotos.map((photo) => (
                        <div key={photo.slot} className="space-y-2">
                          <p className="text-xs font-semibold text-zinc-500">
                            {photo.label || `Photo ${photo.slot}`}
                          </p>
                          {photo.hasFile ? (
                            <VerificationDocumentImage
                              applicationId={applicationId}
                              kind="shop-photos"
                              slot={photo.slot}
                              alt={photo.label || 'Shop photo'}
                              className="max-h-48 w-full rounded-lg border border-zinc-200 bg-zinc-50 object-cover"
                            />
                          ) : (
                            <div className="rounded-lg border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
                              Missing
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>

              {(canDecide || canModerate) && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-zinc-700">
                    {canDecide ? 'Rejection note (required to reject)' : 'Message to owner (optional)'}
                  </label>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    rows={3}
                    className={superInputClass}
                    placeholder={
                      canDecide
                        ? 'Tell the owner what to fix...'
                        : 'Explain why re-verification is needed...'
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {application && (canDecide || canModerate) && (
          <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4 sm:flex-row sm:justify-end">
            {canDecide && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={actionLoading}
                  className={superSecondaryButtonClass}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className={superPrimaryButtonClass}
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Approve
                </button>
              </>
            )}
            {canModerate && (
              <>
                <button
                  type="button"
                  onClick={handleHardReset}
                  disabled={actionLoading}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                >
                  Hard reset
                </button>
                <button
                  type="button"
                  onClick={handleRequestReVerification}
                  disabled={actionLoading}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60"
                >
                  Request re-verification
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
