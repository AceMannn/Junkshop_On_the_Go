export const REPORT_REASONS = [
  { id: 'wrong_weight_amount', label: 'Wrong weight / amount' },
  { id: 'rude_unprofessional', label: 'Rude or unprofessional' },
  { id: 'no_show_late', label: 'No-show / late' },
  { id: 'suspected_fraud', label: 'Suspected fraud' },
  { id: 'other', label: 'Other' },
];

export const MAX_REPORTS_PER_USER = 3;

export function getReportReasonLabel(id) {
  return REPORT_REASONS.find((row) => row.id === id)?.label || id;
}
