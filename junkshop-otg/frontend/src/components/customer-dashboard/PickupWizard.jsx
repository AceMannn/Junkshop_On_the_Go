import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Minus, Plus, Camera } from 'lucide-react';
import { pickupApi } from '../../services/api';
import { useCatalogMaterials } from '../../hooks/useCatalogData';
import EmptyState from '../ui/EmptyState';
import { TIME_SLOTS, materialsSummary } from '../../utils/pickupHelpers';
import { getUserFullName } from '../../utils/userDisplay';

const PICKUP_STEPS = ['Type', 'Shop', 'Materials', 'Schedule', 'Contact', 'Review'];
const DROP_OFF_STEPS = ['Type', 'Shop', 'Materials', 'Schedule', 'Review'];

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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PickupWizard({ user, shops, onClose, onSuccess, prefill = null }) {
  const { materials: catalogMaterials } = useCatalogMaterials({ autoRefresh: false });
  const scheduleDates = useMemo(() => buildScheduleDates(), []);

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
    user?.email?.includes('@customer.junkshop.internal') ? '' : user?.email || ''
  );
  const [address, setAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');

  const isDropOff = requestType === 'drop_off';
  const steps = isDropOff ? DROP_OFF_STEPS : PICKUP_STEPS;

  const openShops = shops.filter((shop) => {
    const status = String(shop.status).toLowerCase();
    if (status === 'suspended') return false;
    const closed = status === 'closed';
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
      }));
    }
    return catalogMaterials.map((row) => ({
      catalogId: row.id,
      name: row.material,
      category: row.category,
      unit: row.unit === 'piece' ? 'piece' : 'kg',
    }));
  }, [assignmentMode, junkshopId, selectedShop, catalogMaterials]);

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

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const next = [...photos];
    for (const file of files) {
      if (next.length >= 3) break;
      if (!file.type.startsWith('image/')) continue;
      const data = await readFileAsDataUrl(file);
      next.push({
        fileName: file.name,
        mimeType: file.type,
        data,
      });
    }
    setPhotos(next.slice(0, 3));
    event.target.value = '';
  };

  const validateStep = () => {
    setError('');
    if (step === 0) return true;
    if (step === 1) {
      if (assignmentMode === 'specific' && !junkshopId) {
        setError('Select a junkshop or choose nearest available.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (selectedMaterials.length === 0) {
        setError('Select at least one material.');
        return false;
      }
      if (photos.length < 1) {
        setError('Upload at least one photo of your materials.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!scheduledDate) {
        setError('Choose a date.');
        return false;
      }
      return true;
    }
    if (!isDropOff && step === 4) {
      const phone = contactPhone.replace(/\D/g, '').slice(0, 11);
      if (!contactName.trim() || !address.trim()) {
        setError('Name and pickup address are required.');
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
        })),
        materialPhotos: photos,
        estimatedWeightKg: totalKg,
        scheduledDate,
        timeSlot,
        address: isDropOff ? selectedShop?.address || address.trim() : address.trim(),
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-[#191c1c]">Book pickup</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-zinc-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-2 flex gap-1">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-emerald-600' : 'bg-zinc-200'}`}
            />
          ))}
        </div>

        <div className="scroll-y-clean flex-1 px-5 py-4 space-y-4">
          {step === 0 && (
            <>
              <p className="text-sm text-[#72796e]">How will you hand over recyclables?</p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'home_pickup', label: 'Home pickup', desc: 'Shop comes to your address' },
                  { id: 'drop_off', label: 'Drop-off at shop', desc: 'Bring items to the junkshop' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setRequestType(opt.id);
                      setStep(0);
                    }}
                    className={`text-left p-4 rounded-xl border-2 transition ${
                      requestType === opt.id
                        ? 'border-emerald-600 bg-emerald-50'
                        : 'border-zinc-200'
                    }`}
                  >
                    <p className="font-semibold">{opt.label}</p>
                    <p className="text-xs text-[#72796e]">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'specific', label: 'Choose shop' },
                  { id: 'nearest', label: 'Nearest available' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAssignmentMode(opt.id)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border ${
                      assignmentMode === opt.id
                        ? 'bg-[#154212] text-white border-[#154212]'
                        : 'border-zinc-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {assignmentMode === 'specific' && (
                <select
                  value={junkshopId}
                  onChange={(event) => setJunkshopId(event.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm"
                >
                  <option value="">Select junkshop</option>
                  {openShops.map((shop) => (
                    <option key={shop.id} value={shop._id || shop.id}>
                      {shop.name} {shop.status === 'Closed' ? '(closed)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          {step === 2 && (
            <>
              {materialOptions.length === 0 ? (
                <EmptyState
                  compact
                  title="No materials listed yet"
                  description="Choose a verified partner shop with materials."
                />
              ) : (
                <div className="scroll-y-clean space-y-2 max-h-52">
                  {materialOptions.map((item) => {
                    const selected = selectedMaterials.find((row) => row.catalogId === item.catalogId);
                    return (
                      <div
                        key={item.catalogId}
                        className={`rounded-xl border px-3 py-3 ${
                          selected ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleMaterial(item)}
                          className="w-full text-left"
                        >
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-[#72796e] capitalize">
                            Sold per {item.unit === 'piece' ? 'piece' : 'kg'}
                          </p>
                        </button>
                        {selected && (
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#72796e]">Quantity</span>
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.catalogId, -1)}
                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200"
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
                                className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200"
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
                </div>
              )}

              <div className="rounded-xl border border-dashed border-zinc-300 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#42493e]">
                  <Camera size={16} />
                  Material photos (required, up to 3)
                </div>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} />
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <img
                        key={`${photo.fileName}-${index}`}
                        src={photo.data}
                        alt={photo.fileName}
                        className="h-20 w-full object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#72796e]">
                  Date
                </span>
                <select
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-sm"
                >
                  {scheduleDates.map((row) => (
                    <option key={row.value} value={row.value}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#72796e]">
                  Time slot
                </span>
                <select
                  value={timeSlot}
                  onChange={(event) => setTimeSlot(event.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-sm"
                >
                  {TIME_SLOTS.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {!isDropOff && step === 4 && (
            <>
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm"
                placeholder="Full name *"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
              />
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm"
                placeholder="Phone (09XXXXXXXXX) *"
                inputMode="numeric"
                maxLength={11}
                value={contactPhone}
                onChange={(event) =>
                  setContactPhone(event.target.value.replace(/\D/g, '').slice(0, 11))
                }
              />
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm"
                placeholder="Email (optional)"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
              <textarea
                rows={3}
                className="w-full border rounded-xl px-4 py-3 text-sm resize-none"
                placeholder="Pickup address *"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
              <textarea
                rows={2}
                className="w-full border rounded-xl px-4 py-3 text-sm resize-none"
                placeholder="Notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </>
          )}

          {step === steps.length - 1 && (
            <div className="text-sm space-y-2 bg-zinc-50 rounded-xl p-4">
              <p>
                <strong>Type:</strong> {isDropOff ? 'Drop-off' : 'Home pickup'}
              </p>
              <p>
                <strong>Shop:</strong> {reviewShopName}
              </p>
              <p>
                <strong>Materials:</strong> {materialsSummary(selectedMaterials)}
              </p>
              <p>
                <strong>Photos:</strong> {photos.length} uploaded
              </p>
              <p>
                <strong>When:</strong> {scheduledDate} · {selectedTimeLabel}
              </p>
              {!isDropOff && (
                <>
                  <p>
                    <strong>Address:</strong> {address}
                  </p>
                  <p>
                    <strong>Phone:</strong> {contactPhone}
                  </p>
                </>
              )}
              {notes && (
                <p>
                  <strong>Notes:</strong> {notes}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((value) => value - 1)}
              className="flex-1 py-3 rounded-xl border font-semibold text-sm"
            >
              <ChevronLeft size={16} className="inline mr-1" />
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-[#154212] text-white font-semibold text-sm"
            >
              Next
              <ChevronRight size={16} className="inline ml-1" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-[#154212] text-white font-semibold text-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
