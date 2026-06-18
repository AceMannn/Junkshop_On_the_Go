export function formatShopRating(shop) {
  const reviewCount = Number(shop?.reviewCount) || 0;
  const rating = Number(shop?.rating) || 0;

  if (reviewCount <= 0 || rating <= 0) {
    return {
      hasReviews: false,
      reviewCount: 0,
      rating: null,
      shortLabel: 'No reviews yet',
      fullLabel: 'No reviews yet',
    };
  }

  const rounded = Number(rating.toFixed(1));

  return {
    hasReviews: true,
    reviewCount,
    rating: rounded,
    shortLabel: `★ ${rounded}`,
    fullLabel: `★ ${rounded} (${reviewCount} review${reviewCount === 1 ? '' : 's'})`,
  };
}
