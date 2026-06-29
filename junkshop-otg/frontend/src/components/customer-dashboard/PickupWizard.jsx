import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Minus,
  Plus,
  Package,
  Store,
  Camera,
  Calendar,
  User,
  ClipboardCheck,
  Truck,
  MapPin,
} from 'lucide-react';
import { pickupApi } from '../../services/api';
import { useFeaturedMaterials } from '../../hooks/useCatalogData';
import EmptyState from '../ui/EmptyState';
import MaterialPhotoUploader from '../ui/MaterialPhotoUploader';
import {
  TIME_SLOTS,
  estimatedPayoutTotal,
  formatPeso,
  materialEstimatedSubtotal,
  materialPriceLabel,
  materialsSummary,
} from '../../utils/pickupHelpers';
import { getUserFullName } from '../../utils/userDisplay';
import PickupAddressPicker from './PickupAddressPicker';

const PICKUP_STEPS = ['Type', 'Shop', 'Materials', 'Photos', 'Schedule', 'Contact', 'Review'];
const DROP_OFF_STEPS = ['Type', 'Shop', 'Materials', 'Photos', 'Schedule', 'Review'];

const STEP_ICONS = {
  Type: Truck,
  Shop: Store,
  Materials: Package,
  Photos: Camera,
  Schedule: Calendar,
  Contact: User,
  Review: ClipboardCheck,
};

const STEP_HINTS = {
  Type: 'Choose how you will hand over your recyclables.',
  Shop: 'Pick a partner junkshop or let us find the nearest one.',
  Materials: 'Select what you are selling and how much.',
  Photos: 'Show the shop what you are bringing — crop or replace anytime.',
  Schedule: 'Pick a date and time that works for you.',
  Contact: 'Where should the shop pick up your items?',
  Review: 'Double-check everything before you submit.',
};

function buildScheduleDates() {
  const rows = [];
  const today = new Date();
  for (let offset = 0; offset <= 7; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    rows.push({
      value: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    });
  }
  return rows;
}

function StepHeader({ steps, step }) {
  const label = steps[step];
  const Icon = STEP_ICONS[label] || Package;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
          <Icon size={16} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Step {step + 1} of {steps.length}
          </p>
          <h3 className="font-bold text-[#191c1c]">{label}</h3>
        </div>
      </div>
      <p className="text-sm text-[#72796e] pl-10">{STEP_HINTS[label]}</p>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-[#72796e]">
      {children}
    </span>
  );
}

const inputClass =
  'w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600';

export default function PickupWizard({ user, shops, onClose, onSuccess, prefill = null }) {
  const { materials: marketMaterials } = useFeaturedMaterials({ autoRefresh: false });
  const scheduleDates = useMemo(() => buildScheduleDates(), []);
  const savedAddress = String(user?.address || '').trim();
  const savedLocation =
    Number.isFinite(Number(user?.location?.lat)) &&
    Number.isFinite(Number(user?.location?.lng))
      ? {
          lat: Number(user.location.lat),
          lng: Number(user.location.lng),
          label: savedAddress,
        }
      : null;
  const hasConfirmedSavedAddress = Boolean(savedAddress && user?.addressConfirmed && savedLocation);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [requestType, setRequestType] = useState('home_pickup');
  const [assignmentMode, setAssignmentMode] = useState(prefill?.junkshopId ? 'specific' : 'specific');
  const [junkshopId, setJunkshopId] = useState(prefill?.junkshopId ? String(prefill.junkshopId) : '');
  const [selectedMaterials, setSelectedMaterials] = useState(
    prefill?.name
      ? [
          {
            catalogId: prefill.catalogId || `prefill-${prefill.name}`,
            name: prefill.name,
            category: prefill.category || '',
            quantity: 1,
            unit: prefill.unit === 'piece' ? 'piece' : 'kg',
            price: Number(prefill.price) || 0,
          },
        ]
      : []
  );
  const [photos, setPhotos] = useState([]);
  const [scheduledDate, setScheduledDate] = useState(scheduleDates[0]?.value || '');
  const [timeSlot, setTimeSlot] = useState('morning');
  const [contactName, setContactName] = useState(getUserFullName(user));
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(
    user?.email || ''
  );
  const [pickupLocation, setPickupLocation] = useState(
    hasConfirmedSavedAddress ? savedLocation : null
  ); // { lat, lng, label }
  const [addressConfirmed, setAddressConfirmed] = useState(hasConfirmedSavedAddress);
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');

  const address = pickupLocation?.label || '';

  const isDropOff = requestType === 'drop_off';
  const steps = isDropOff ? DROP_OFF_STEPS : PICKUP_STEPS;
  const currentLabel = steps[step];

  const openShops = shops.filter((shop) => {
    const status = String(shop.status).toLowerCase();
    if (status === 'suspended') return false;
    const closed = status === 'closed';
    const acceptsPickup = shop.pickupEnabled !== false;
    if (!isDropOff && !acceptsPickup) return false;
    return !closed || isDropOff;
  });

  const selectedShop = shops.find((shop) => String(shop._id || shop.id) === String(junkshopId));

  const materialOptions = useMemo(() => {
    if (assignmentMode === 'specific' && junkshopId && selectedShop?.listingPrices?.length > 0) {
      return selectedShop.listingPrices.map((row, index) => ({
        catalogId: `shop-${row.name}-${index}`,
        name: row.name,
        category: row.category,
        unit: row.unit === 'piece' ? 'piece' : 'kg',
        price: Number(row.price) || 0,
      }));
    }
    return marketMaterials.map((row) => ({
      catalogId: row.id,
      name: row.material,
      category: row.category,
      unit: row.unit === 'piece' ? 'piece' : 'kg',
      price: Number(row.price) || 0,
    }));
  }, [assignmentMode, junkshopId, marketMaterials, selectedShop]);

  const toggleMaterial = (item) => {
    setSelectedMaterials((prev) => {
      const exists = prev.find((row) => row.catalogId === item.catalogId);
      if (exists) return prev.filter((row) => row.catalogId !== item.catalogId);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (catalogId, delta) => {
    setSelectedMaterials((prev) =>
      prev.map((row) => {
        if (row.catalogId !== catalogId) return row;
        return { ...row, quantity: Math.max(1, (row.quantity || 1) + delta) };
      })
    );
  };

  const validateStep = () => {
    setError('');
    if (currentLabel === 'Shop') {
      if (assignmentMode === 'specific' && !junkshopId) {
        setError('Select a junkshop or choose nearest available.');
        return false;
      }
      return true;
    }
    if (currentLabel === 'Materials') {
      if (selectedMaterials.length === 0) {
        setError('Select at least one material.');
        return false;
      }
      return true;
    }
    if (currentLabel === 'Photos') {
      if (photos.length < 1) {
        setError('Upload at least one photo of your materials.');
        return false;
      }
      return true;
    }
    if (currentLabel === 'Schedule') {
      if (!scheduledDate) {
        setError('Choose a date.');
        return false;
      }
      return true;
    }
    if (currentLabel === 'Contact') {
      const phone = contactPhone.replace(/\D/g, '').slice(0, 11);
      if (!contactName.trim()) {
        setError('Full name is required.');
        return false;
      }
      if (!addressConfirmed || !address.trim()) {
        setError('Confirm your pickup location on the map before continuing.');
        return false;
      }
      if (!/^09\d{9}$/.test(phone)) {
        setError('Enter a valid contact phone (09XXXXXXXXX).');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((value) => Math.min(value + 1, steps.length - 1));
  };

  const totalKg = selectedMaterials
    .filter((row) => row.unit === 'kg')
    .reduce((sum, row) => sum + (row.quantity || 0), 0);
  const estimatedTotal = estimatedPayoutTotal(selectedMaterials);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await pickupApi.create({
        requestType,
        assignmentMode,
        junkshopId: assignmentMode === 'specific' ? junkshopId : undefined,
        contactName: contactName.trim(),
        contactPhone: contactPhone.replace(/\D/g, '').slice(0, 11),
        contactEmail: contactEmail.trim(),
        materials: selectedMaterials.map((row) => ({
          catalogId: row.catalogId,
          name: row.name,
          category: row.category,
          quantity: row.quantity,
          unit: row.unit,
          price: Number(row.price) || 0,
          estimatedSubtotal: materialEstimatedSubtotal(row),
        })),
        materialPhotos: photos,
        estimatedWeightKg: totalKg,
        scheduledDate,
        timeSlot,
        address: isDropOff ? selectedShop?.address || address.trim() : address.trim(),
        ...(pickupLocation &&
        !isDropOff &&
        Number.isFinite(Number(pickupLocation.lat)) &&
        Number.isFinite(Number(pickupLocation.lng))
          ? { pickupLocation: { lat: pickupLocation.lat, lng: pickupLocation.lng } }
          : {}),
        landmark: landmark.trim(),
        notes: notes.trim(),
      });
      onSuccess('Pickup request submitted! Wait for shop acceptance.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTimeLabel = TIME_SLOTS.find((row) => row.id === timeSlot)?.label || timeSlot;
  const reviewShopName =
    assignmentMode === 'nearest'
      ? 'Nearest available'
      : openShops.find((shop) => String(shop._id || shop.id) === String(junkshopId))?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 bg-gradient-to-r from-[#154212] to-emerald-800 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg">Book pickup</h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {isDropOff ? 'Drop-off at shop' : 'Home pickup'} · JunkShop On-The-Go
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mt-4 flex gap-1">
            {steps.map((label, index) => (
              <div
                key={label}
                title={label}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index <= step ? 'bg-white' : 'bg-white/25'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="scroll-y-clean flex-1 px-5 py-5 space-y-5">
          <StepHeader steps={steps} step={step} />

          {currentLabel === 'Type' && (
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  id: 'home_pickup',
                  label: 'Home pickup',
                  desc: 'The shop comes to your address on your schedule.',
                  icon: Truck,
                },
                {
                  id: 'drop_off',
                  label: 'Drop-off at shop',
                  desc: 'Bring items to the junkshop during your time slot.',
                  icon: MapPin,
                },
              ].map((opt) => {
                const OptIcon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setRequestType(opt.id);
                      setStep(0);
                    }}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${
                      requestType === opt.id
                        ? 'border-emerald-600 bg-emerald-50 shadow-sm ring-1 ring-emerald-600/20'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          requestType === opt.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        <OptIcon size={20} />
                      </span>
                      <div>
                        <p className="font-semibold text-[#191c1c]">{opt.label}</p>
                        <p className="text-xs text-[#72796e] mt-0.5">{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentLabel === 'Shop' && (
            <div className="space-y-4">
              {prefill?.junkshopId && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
                  <Store size={14} className="shrink-0" />
                  <span>
                    Pre-selected from <strong>Sell your recyclables</strong>. You can still change it below.
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100">
                {[
                  { id: 'specific', label: 'Choose shop' },
                  { id: 'nearest', label: 'Nearest' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAssignmentMode(opt.id)}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition ${
                      assignmentMode === opt.id
                        ? 'bg-white text-[#154212] shadow-sm'
                        : 'text-[#72796e]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {assignmentMode === 'specific' && (
                <label className="block space-y-1.5">
                  <FieldLabel>Junkshop</FieldLabel>
                  <select
                    value={junkshopId}
                    onChange={(event) => setJunkshopId(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select junkshop</option>
                    {openShops.map((shop) => (
                      <option key={shop.id} value={shop._id || shop.id}>
                        {shop.name} {shop.status === 'Closed' ? '(closed)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {currentLabel === 'Materials' && (
            <>
              {materialOptions.length === 0 ? (
                <EmptyState
                  compact
                  title="No materials listed yet"
                  description="Choose a verified partner shop with materials."
                />
              ) : (
                <div className="scroll-y-clean space-y-2 max-h-64">
                  {materialOptions.map((item) => {
                    const selected = selectedMaterials.find((row) => row.catalogId === item.catalogId);
                    return (
                      <div
                        key={item.catalogId}
                        className={`rounded-xl border px-3 py-3 transition ${
                          selected
                            ? 'border-emerald-500 bg-emerald-50/80'
                            : 'border-zinc-200 bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleMaterial(item)}
                          className="w-full text-left"
                        >
                          <p className="font-semibold text-sm">{item.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-[#154212]">
                              {materialPriceLabel(item)}
                            </span>
                            <span className="text-[#72796e] capitalize">
                              Sold per {item.unit === 'piece' ? 'piece' : 'kg'}
                            </span>
                          </div>
                        </button>
                        {selected && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-semibold text-[#72796e]">Quantity</span>
                              <p className="text-xs font-bold text-[#154212] mt-0.5">
                                Est. subtotal: {formatPeso(materialEstimatedSubtotal(selected))}
                              </p>
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.catalogId, -1)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="min-w-[2rem] text-center font-bold">
                                {selected.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.catalogId, 1)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white"
                                aria-label="Increase quantity"
                              >
                                <Plus size={16} />
                              </button>
                              <span className="text-xs font-semibold text-[#72796e]">
                                {selected.unit === 'piece' ? 'pc' : 'kg'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {estimatedTotal > 0 && (
                    <div className="sticky bottom-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-emerald-900">Estimated total</p>
                        <p className="text-base font-bold text-[#154212]">
                          {formatPeso(estimatedTotal)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#72796e]">
                        Final amount may change after the junkshop verifies weight and materials.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {currentLabel === 'Photos' && (
            <MaterialPhotoUploader photos={photos} onChange={setPhotos} maxPhotos={3} />
          )}

          {currentLabel === 'Schedule' && (
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <FieldLabel>Date</FieldLabel>
                <select
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                  className={inputClass}
                >
                  {scheduleDates.map((row) => (
                    <option key={row.value} value={row.value}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <FieldLabel>Time slot</FieldLabel>
                <select
                  value={timeSlot}
                  onChange={(event) => setTimeSlot(event.target.value)}
                  className={inputClass}
                >
                  {TIME_SLOTS.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {currentLabel === 'Contact' && (
            <div className="space-y-3">
              <input
                className={inputClass}
                placeholder="Full name *"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Phone (09XXXXXXXXX) *"
                inputMode="numeric"
                maxLength={11}
                value={contactPhone}
                onChange={(event) =>
                  setContactPhone(event.target.value.replace(/\D/g, '').slice(0, 11))
                }
              />
              <input
                className={inputClass}
                placeholder="Email (optional)"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
              <div className="space-y-1.5">
                <FieldLabel>Pickup location *</FieldLabel>
                <PickupAddressPicker
                  confirmed={addressConfirmed}
                  confirmedLabel={address}
                  onConfirm={(loc) => {
                    setPickupLocation(loc);
                    setAddressConfirmed(true);
                    setError('');
                  }}
                  onReset={() => {
                    setPickupLocation(null);
                    setAddressConfirmed(false);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Landmark (optional)</FieldLabel>
                <input
                  className={inputClass}
                  placeholder="e.g. Near 7-Eleven, Blue gate house"
                  value={landmark}
                  onChange={(event) => setLandmark(event.target.value)}
                />
              </div>
              <textarea
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="Notes for the shop (optional)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          )}

          {currentLabel === 'Review' && (
            <div className="space-y-4">
              <div className="text-sm space-y-2.5 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                <p>
                  <span className="text-[#72796e]">Type · </span>
                  <strong>{isDropOff ? 'Drop-off' : 'Home pickup'}</strong>
                </p>
                <p>
                  <span className="text-[#72796e]">Shop · </span>
                  <strong>{reviewShopName}</strong>
                </p>
                <p>
                  <span className="text-[#72796e]">Materials · </span>
                  <strong>{materialsSummary(selectedMaterials)}</strong>
                </p>
                {estimatedTotal > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-emerald-900">Estimated total</span>
                      <strong className="text-[#154212]">{formatPeso(estimatedTotal)}</strong>
                    </div>
                    <p className="mt-1 text-xs text-[#72796e]">
                      Final amount may change after the junkshop verifies weight and materials.
                    </p>
                  </div>
                )}
                <p>
                  <span className="text-[#72796e]">When · </span>
                  <strong>
                    {scheduledDate} · {selectedTimeLabel}
                  </strong>
                </p>
                {!isDropOff && (
                  <>
                    <p>
                      <span className="text-[#72796e]">Address · </span>
                      <strong>{address}</strong>
                    </p>
                    {landmark && (
                      <p>
                        <span className="text-[#72796e]">Landmark · </span>
                        <strong>{landmark}</strong>
                      </p>
                    )}
                    <p>
                      <span className="text-[#72796e]">Phone · </span>
                      <strong>{contactPhone}</strong>
                    </p>
                  </>
                )}
                {notes && (
                  <p>
                    <span className="text-[#72796e]">Notes · </span>
                    <strong>{notes}</strong>
                  </p>
                )}
              </div>
              {photos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#72796e]">
                    Photos ({photos.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <img
                        key={`review-${index}`}
                        src={photo.data}
                        alt={photo.fileName}
                        className="aspect-[4/3] w-full object-cover rounded-lg border border-zinc-200"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 flex gap-2 px-5 py-4 border-t bg-[#f9f9f8]">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((value) => value - 1)}
              className="flex-1 py-3 rounded-xl border border-zinc-200 bg-white font-semibold text-sm text-[#42493e] hover:bg-zinc-50"
            >
              <ChevronLeft size={16} className="inline mr-1" />
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-[#154212] text-white font-semibold text-sm hover:bg-emerald-900 shadow-sm"
            >
              Next
              <ChevronRight size={16} className="inline ml-1" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-[#154212] text-white font-semibold text-sm hover:bg-emerald-900 disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
