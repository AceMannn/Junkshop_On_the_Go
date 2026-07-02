import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { adminApi } from '../services/api';
import VerificationDocumentImage from '../components/VerificationDocumentImage';
import { formatDate, statusPillClass } from '../utils/format';
import {
  adminCardClass,
  adminInputClass,
  adminPageTitleClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from '../utils/adminUi';

const docTabs = [
  { id: 'government-id', label: 'Government ID' },
  { id: 'business-permit', label: 'Business permit' },
  { id: 'shop-photos', label: 'Shop photos' },
];

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#191c1c] capitalize">{value || '—'}</p>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [application, setApplication] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState('government-id');

  const loadApplication = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getApplication(id);
      setApplication(data.application);
    } catch (err) {
      setError(err.message || 'Could not load application.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const docs = application?.verification?.documents;
  const archive = application?.verificationArchive || [];
  const canDecide = application?.verificationStatus === 'pending';
  const canModerate = application && !canDecide;

  const handleApprove = async () => {
    setActionLoading(true);
    setError('');
    try {
      await adminApi.approveApplication(id);
      navigate('/applications?status=pending');
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
      await adminApi.rejectApplication(id, rejectNote.trim());
      navigate('/applications?status=pending');
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
      const { application: updated } = await adminApi.requestReVerification(id, rejectNote.trim());
      setApplication(updated);
    } catch (err) {
      setError(err.message || 'Could not request re-verification.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading application...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-4">
        <p className="text-red-700">{error || 'Application not found.'}</p>
        <Link to="/applications" className={adminSecondaryButtonClass}>Back to applications</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Link
            to="/applications"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#154212] hover:text-[#0f3310]"
          >
            <ArrowLeft size={16} />
            Back to applications
          </Link>
          <div>
            <h1 className={adminPageTitleClass}>{application.junkshopName}</h1>
            <p className="mt-1 text-sm text-[#5c6658]">
              {application.ownerName} · {application.phone}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide capitalize ${statusPillClass(
              application.verificationStatus
            )}`}
          >
            {application.verificationStatus}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {application.verificationRejectNote && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Latest admin note</p>
          <p className="mt-1 whitespace-pre-wrap">{application.verificationRejectNote}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-4">
          <section className={`${adminCardClass} p-5 space-y-4`}>
            <h2 className="text-base font-bold text-[#191c1c]">Application details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Email" value={application.email} />
              <InfoRow label="Phone" value={application.phone} />
              <InfoRow label="Address" value={application.address} />
              <InfoRow label="Submitted" value={formatDate(application.verificationSubmittedAt)} />
              <InfoRow
                label="Shop published"
                value={application.shop?.isPublished ? 'Yes' : 'No'}
              />
              <InfoRow label="Reviewed" value={formatDate(application.verificationReviewedAt)} />
            </div>
          </section>

          {archive.length > 0 && (
            <section className={`${adminCardClass} p-5 space-y-3`}>
              <h2 className="text-base font-bold text-[#191c1c]">Archived submissions</h2>
              <p className="text-sm text-zinc-600">
                Audit history only — files are not re-loaded here to keep review fast.
              </p>
              {archive.map((entry, index) => (
                <div
                  key={`${entry.archivedAt || 'archive'}-${index}`}
                  className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm"
                >
                  <p className="font-medium capitalize">
                    {entry.action?.replace(/_/g, ' ') || 'Archived'}
                    {entry.previousStatus ? ` · was ${entry.previousStatus}` : ''}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{formatDate(entry.archivedAt)}</p>
                  {entry.reason && (
                    <p className="mt-2 text-zinc-700 whitespace-pre-wrap">{entry.reason}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>

        <section className={`${adminCardClass} p-5 space-y-4`}>
          <h2 className="text-base font-bold text-[#191c1c]">Verification documents</h2>

          <div className="flex flex-wrap gap-2 border-b border-zinc-100 pb-3">
            {docTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDocTab(tab.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
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
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">
                Type: {docs?.governmentId?.docType || 'Not selected'}
              </p>
              {docs?.governmentId?.hasFile ? (
                <VerificationDocumentImage
                  applicationId={id}
                  kind="government-id"
                  alt="Government ID"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-400">
                  Not uploaded
                </div>
              )}
            </div>
          )}

          {activeDocTab === 'business-permit' && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">
                Type: {docs?.businessPermit?.docType || 'Not selected'}
              </p>
              {docs?.businessPermit?.hasFile ? (
                <VerificationDocumentImage
                  applicationId={id}
                  kind="business-permit"
                  alt="Business permit"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-400">
                  Not uploaded
                </div>
              )}
            </div>
          )}

          {activeDocTab === 'shop-photos' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {(docs?.shopPhotos || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center text-sm text-zinc-400">
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
                        applicationId={id}
                        kind="shop-photos"
                        slot={photo.slot}
                        alt={photo.label || 'Shop photo'}
                        className="w-full rounded-xl border border-zinc-200 object-cover max-h-56 bg-zinc-50"
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
                        Missing
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>

      {(canDecide || canModerate) && (
        <section className={`${adminCardClass} p-5 space-y-4`}>
          {canDecide && (
            <>
              <label className="block text-sm font-semibold text-[#42493e]">
                Rejection note (required to reject)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                className={adminInputClass}
                placeholder="Tell the owner what to fix..."
              />
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className={adminPrimaryButtonClass}
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Approve
                </button>
              </div>
            </>
          )}

          {canModerate && (
            <>
              <label className="block text-sm font-semibold text-[#42493e]">
                Message to owner (optional)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                className={adminInputClass}
                placeholder="Explain why re-verification is needed..."
              />
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={handleRequestReVerification}
                  disabled={actionLoading}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                  Request re-verification
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
