export function getPickupRequestId(notification) {
  const ref = notification?.pickupRequest;
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  return ref._id || ref.id || null;
}

export function getProviderNotificationTarget(notification) {
  const pickupId = getPickupRequestId(notification);
  if (pickupId) {
    return { tab: 'requests', focusRequestId: pickupId };
  }

  if (notification?.type === 'verification') {
    return { tab: 'verification' };
  }

  return null;
}

export function isProviderNotificationNavigable(notification) {
  return Boolean(getProviderNotificationTarget(notification));
}

export function getCustomerNotificationTarget(notification) {
  const pickupId = getPickupRequestId(notification);
  if (pickupId) {
    return { tab: 'pickups', focusPickupId: pickupId };
  }

  return null;
}

export function isCustomerNotificationNavigable(notification) {
  return Boolean(getCustomerNotificationTarget(notification));
}
