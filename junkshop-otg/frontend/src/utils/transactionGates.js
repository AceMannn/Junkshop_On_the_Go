export const TRANSACTION_ADDRESS_SETTINGS_MESSAGE =
  'Add and confirm your street address in Settings before booking a pickup.';

export function hasConfirmedCustomerAddress(user) {
  const address = String(user?.address || '').trim();
  const lat = Number(user?.location?.lat);
  const lng = Number(user?.location?.lng);
  return Boolean(
    address &&
      user?.addressConfirmed &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
  );
}
