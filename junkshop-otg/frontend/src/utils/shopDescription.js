const TEMPLATES = [
  (name) => `${name} is a trusted local junkshop accepting recyclable materials from the community. Drop off or schedule a pickup today.`,
  (name) => `Partner with ${name} to sell your scrap materials at fair prices. Fast service, reliable payments.`,
  (name) => `${name} buys a wide range of recyclables including metals, paper, plastic, and more. Contact them to check current rates.`,
];

/**
 * Returns shop.description if set (non-empty), otherwise generates a short
 * template description from the shop name.
 */
export function shopAutoDescription(shopName, description) {
  const trimmed = String(description || '').trim();
  if (trimmed) return trimmed;

  const name = String(shopName || 'This junkshop').trim();
  const index = name.charCodeAt(0) % TEMPLATES.length;
  return TEMPLATES[index](name);
}
