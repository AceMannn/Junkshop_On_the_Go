/**
 * Masks a customer name like Shopee does:
 *   "Ace Mangalili" → "A*****e M*****i"
 *   "John"          → "J***n"
 */
export function maskCustomerName(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'Customer';

  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 2) return part;
      const first = part[0];
      const last = part[part.length - 1];
      const stars = '*'.repeat(Math.min(part.length - 2, 5));
      return `${first}${stars}${last}`;
    })
    .join(' ');
}
