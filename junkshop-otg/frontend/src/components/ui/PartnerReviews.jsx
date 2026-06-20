import { useState } from 'react';
import { domainApi } from '../../services/api';
import { formatReviewDate, getReviewCount } from '../../utils/reviewFormat';
import ReviewSnippet from './ReviewSnippet';

export default function PartnerReviews({ shop }) {
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reviewCount = getReviewCount(shop);
  const hasReviews = reviewCount > 0 || Boolean(shop.latestReview);

  if (!hasReviews) return null;

  const handleToggle = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { reviews: rows } = await domainApi.getJunkshopReviews(shop.id, { limit: 5 });
      setReviews(rows);
      setExpanded(true);
    } catch (err) {
      setError(err.message || 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {shop.latestReview && <ReviewSnippet review={shop.latestReview} />}

      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="text-xs font-semibold text-eco-green hover:text-[#358F52] transition-colors disabled:opacity-60"
      >
        {loading
          ? 'Loading reviews…'
          : expanded
            ? 'Hide reviews'
            : reviewCount > 1
              ? `View all reviews (${reviewCount})`
              : 'View review'}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {expanded && reviews.length > 0 && (
        <ul className="space-y-2">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm"
            >
              <p className="text-xs font-semibold text-gray-800">
                ★ {review.score} · {review.customerName}
              </p>
              <p className="text-[10px] text-gray-500">{formatReviewDate(review.createdAt)}</p>
              {review.comment ? (
                <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
              ) : (
                <p className="text-xs text-gray-500 italic mt-1">No written comment.</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {expanded && !loading && !error && reviews.length === 0 && (
        <p className="text-xs text-gray-500">No reviews yet.</p>
      )}
    </div>
  );
}
