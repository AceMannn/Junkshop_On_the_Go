import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { domainApi } from '../../services/api';
import { REPORT_REASONS, MAX_REPORTS_PER_USER } from '../../data/reportReasons';

export default function ReportTransactionModal({
  isOpen,
  onClose,
  row,
  onSuccess,
  onError,
}) {
  const [reasonCode, setReasonCode] = useState(REPORT_REASONS[0].id);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportMeta, setReportMeta] = useState({ count: 0, canReport: true });

  useEffect(() => {
    if (!isOpen || !row?.reportSourceType || !row?.id) return;

    let cancelled = false;
    domainApi
      .getMyReports({ sourceType: row.reportSourceType, sourceId: row.id })
      .then((data) => {
        if (!cancelled) {
          setReportMeta({
            count: data.count || 0,
            canReport: data.canReport !== false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setReportMeta({ count: 0, canReport: true });
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, row?.id, row?.reportSourceType]);

  useEffect(() => {
    if (!isOpen) {
      setReasonCode(REPORT_REASONS[0].id);
      setDetails('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !row) return null;

  const counterpartyLabel = row.counterparty || row.shop || '—';
  const atLimit = !reportMeta.canReport || reportMeta.count >= MAX_REPORTS_PER_USER;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (atLimit) return;

    if (reasonCode === 'other' && !details.trim()) {
      onError?.('Please provide details when selecting Other.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await domainApi.submitReport({
        sourceType: row.reportSourceType,
        sourceId: row.id,
        reasonCode,
        details: details.trim(),
      });
      onSuccess?.(data.message || 'Report submitted.');
      onClose();
    } catch (err) {
      onError?.(err.message || 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-zinc-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <h2 className="text-lg font-bold text-[#191c1c]">Report transaction</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-[#72796e] hover:bg-zinc-200"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm space-y-1">
            <p>
              <span className="text-[#72796e]">{row.reportTargetLabel || 'Shop'}: </span>
              <strong>{counterpartyLabel}</strong>
            </p>
            <p>
              <span className="text-[#72796e]">Date: </span>
              <strong>{row.date}</strong>
              {row.amount && row.amount !== '—' ? (
                <span className="text-[#72796e]"> · {row.amount}</span>
              ) : null}
            </p>
          </div>

          {atLimit ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              Report limit reached ({MAX_REPORTS_PER_USER}/{MAX_REPORTS_PER_USER}) for this record.
            </p>
          ) : (
            <>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-[#42493e]">
                  Why are you reporting this? <span className="text-red-500">*</span>
                </span>
                <select
                  value={reasonCode}
                  onChange={(event) => setReasonCode(event.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                >
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-[#42493e]">
                  Additional details {reasonCode === 'other' ? '(required)' : '(optional)'}
                </span>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  placeholder="Describe what happened..."
                />
              </label>

              <p className="text-xs text-[#72796e]">
                Reports submitted: {reportMeta.count}/{MAX_REPORTS_PER_USER}
              </p>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-[#42493e]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || atLimit}
              className="flex-1 py-3 rounded-xl bg-[#154212] text-white text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : atLimit ? 'Report limit reached' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
