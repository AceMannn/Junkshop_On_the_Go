import { truncateReviewComment, formatReviewDate } from '../../utils/reviewFormat';

export default function ReviewSnippet({ review, maxLength = 100, className = '' }) {
  if (!review) return null;

  const comment = review.comment
    ? truncateReviewComment(review.comment, maxLength)
    : null;

  return (
    <div className={`rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 ${className}`}>
      <p className="text-xs font-semibold text-gray-700">
        ★ {review.score} · {review.customerName}
      </p>
      {review.createdAt && (
        <p className="text-[10px] text-gray-500">{formatReviewDate(review.createdAt)}</p>
      )}
      {comment ? (
        <p className="text-sm text-gray-700 mt-1 line-clamp-2">&ldquo;{comment}&rdquo;</p>
      ) : (
        <p className="text-xs text-gray-500 italic mt-1">No written comment.</p>
      )}
    </div>
  );
}
