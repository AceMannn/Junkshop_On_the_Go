export function truncateReviewComment(comment, maxLength = 100) {
  if (!comment) return '';
  const trimmed = comment.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}…`;
}

export function formatReviewDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getReviewCount(shop) {
  const count = Number(shop?.reviewCount);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
