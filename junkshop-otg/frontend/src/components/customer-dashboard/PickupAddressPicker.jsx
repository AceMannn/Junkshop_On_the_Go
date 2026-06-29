import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import { mapApi } from "../../services/api";
import { JUNKSHOP_MAP_CENTER } from "../maps/JunkshopsMap";

function pickupPinIcon() {
    return L.divIcon({
        className: "pickup-address-pin",
        html: `<span style="display:block;width:20px;height:20px;border-radius:50%;background:#154212;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
}

function isCoordinateLabel(label) {
    return /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/.test(String(label || ""));
}

function extractReverseResult(response) {
    return response?.result || response || {};
}

/**
 * Compact map-based address picker for the PickupWizard Contact step.
 * Props:
 *   onConfirm({ label, lat, lng, weakLabel }) — called when user confirms location
 *   onReset()  — called when user clicks "Change location"
 *   confirmed  — boolean, controlled from parent so back-nav preserves state
 *   confirmedLabel — string shown in confirmed state
 */
export default function PickupAddressPicker({
    onConfirm,
    onReset,
    confirmed = false,
    confirmedLabel = "",
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const searchTimerRef = useRef(null);

    const [mapReady, setMapReady] = useState(false);
    const [pin, setPin] = useState(null); // { lat, lng, label, weakLabel }
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [gpsStatus, setGpsStatus] = useState("idle"); // idle | loading | ready | denied | unsupported
    const [reverseLoading, setReverseLoading] = useState(false);

    const refreshMap = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;
        window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    }, []);

    // Init map
    useLayoutEffect(() => {
        if (confirmed) return;
        const container = containerRef.current;
        if (!container || mapRef.current) return;

        const map = L.map(container, {
            center: [JUNKSHOP_MAP_CENTER.lat, JUNKSHOP_MAP_CENTER.lng],
            zoom: 14,
            scrollWheelZoom: false,
            zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        // Click map to place/move pin
        map.on("click", async (e) => {
            const { lat, lng } = e.latlng;
            placePin(map, lat, lng);
            await reversePin(lat, lng);
        });

        mapRef.current = map;
        setMapReady(true);

        const t1 = setTimeout(refreshMap, 100);
        const t2 = setTimeout(refreshMap, 400);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
            setMapReady(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [confirmed]);

    // Refresh map size on container resize
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !mapReady) return;
        refreshMap();
        const observer = new ResizeObserver(refreshMap);
        observer.observe(container);
        return () => observer.disconnect();
    }, [mapReady, refreshMap]);

    const placePin = useCallback((map, lat, lng) => {
        if (!map) return;
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            const marker = L.marker([lat, lng], {
                icon: pickupPinIcon(),
                draggable: true,
            }).addTo(map);

            marker.on("dragend", async () => {
                const pos = marker.getLatLng();
                await reversePin(pos.lat, pos.lng);
            });

            markerRef.current = marker;
        }
        map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const reversePin = useCallback(async (lat, lng) => {
        setReverseLoading(true);
        try {
            const response = await mapApi.reverseGeocode(lat, lng);
            const result = extractReverseResult(response);
            const label = result?.label || "";
            const isWeak = !label || isCoordinateLabel(label);
            setPin({
                lat,
                lng,
                label: label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                weakLabel: Boolean(isWeak),
            });
        } catch {
            setPin({
                lat,
                lng,
                label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                weakLabel: true,
            });
        } finally {
            setReverseLoading(false);
        }
    }, []);

    // Search autocomplete
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        const q = query.trim();
        if (q.length < 3) {
            setSuggestions([]);
            return;
        }
        searchTimerRef.current = setTimeout(async () => {
            try {
                setSearching(true);
                const { results } = await mapApi.geocode(q);
                setSuggestions(results || []);
            } catch {
                setSuggestions([]);
            } finally {
                setSearching(false);
            }
        }, 450);

        return () => clearTimeout(searchTimerRef.current);
    }, [query]);

    const applySuggestion = (item) => {
        setQuery(item.label);
        setSuggestions([]);
        const map = mapRef.current;
        placePin(map, item.lat, item.lng);
        setPin({ lat: item.lat, lng: item.lng, label: item.label, weakLabel: false });
    };

    const requestGps = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsStatus("unsupported");
            return;
        }
        setGpsStatus("loading");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                const map = mapRef.current;
                placePin(map, lat, lng);
                await reversePin(lat, lng);
                setGpsStatus("ready");
            },
            () => setGpsStatus("denied"),
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
        );
    }, [placePin, reversePin]);

    const handleConfirm = () => {
        if (!pin) return;
        if (pin.weakLabel) return;
        onConfirm({ label: pin.label, lat: pin.lat, lng: pin.lng, weakLabel: pin.weakLabel });
    };

    // ── Confirmed state ────────────────────────────────────────────────────
    if (confirmed) {
        return (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 space-y-2">
                <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-0.5">
                            Pickup location confirmed
                        </p>
                        <p className="text-sm text-[#191c1c] leading-snug break-words">
                            {confirmedLabel}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#154212] hover:underline"
                >
                    <X size={12} />
                    Change location
                </button>
            </div>
        );
    }

    // ── Picker state ───────────────────────────────────────────────────────
    return (
        <div className="space-y-2">
            {/* Search + GPS row */}
            <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                    <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-3 py-2.5 gap-2">
                        <Search size={14} className="text-[#72796e] shrink-0" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search pickup address…"
                            className="w-full bg-transparent outline-none text-sm min-w-0"
                        />
                        {searching && (
                            <span className="text-[10px] text-[#72796e] shrink-0">…</span>
                        )}
                    </div>
                    {suggestions.length > 0 && (
                        <ul className="absolute z-[900] mt-1 w-full max-h-36 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                            {suggestions.map((item) => (
                                <li key={`${item.lat}-${item.lng}`}>
                                    <button
                                        type="button"
                                        onClick={() => applySuggestion(item)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 border-b border-zinc-50 last:border-0"
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button
                    type="button"
                    onClick={requestGps}
                    disabled={gpsStatus === "loading"}
                    title="Use my location"
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-white border border-zinc-200 px-3 py-2.5 text-xs font-semibold text-[#154212] hover:bg-emerald-50 shrink-0 disabled:opacity-60"
                >
                    <LocateFixed size={14} />
                    <span className="hidden sm:inline whitespace-nowrap">
                        {gpsStatus === "loading" ? "Locating…" : "Use my location"}
                    </span>
                </button>
            </div>

            {/* GPS status messages */}
            {(gpsStatus === "denied" || gpsStatus === "unsupported") && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    {gpsStatus === "denied"
                        ? "Location blocked — search your address instead."
                        : "GPS unavailable — search your address instead."}
                </p>
            )}

            {/* Map */}
            <div
                ref={containerRef}
                className="w-full h-44 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 z-0 [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-control-attribution]:text-[10px]"
                aria-label="Select pickup location on map"
            />

            <p className="text-[11px] text-[#72796e]">
                Tap the map or drag the pin to set your exact pickup spot.
            </p>

            {/* Selected address preview + Confirm */}
            {pin && (
                <div className="rounded-xl border border-zinc-200 bg-[#f9f9f8] px-3 py-2.5 space-y-2">
                    <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-[#154212] shrink-0 mt-0.5" />
                        <p className="text-sm text-[#191c1c] leading-snug break-words flex-1 min-w-0">
                            {reverseLoading ? (
                                <span className="text-[#72796e] animate-pulse">Getting address…</span>
                            ) : (
                                pin.label
                            )}
                        </p>
                    </div>
                    {pin.weakLabel && !reverseLoading && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                            Address details are unclear. Search and select a real address before confirming.
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={reverseLoading || pin.weakLabel}
                        className="w-full py-2 rounded-xl bg-[#154212] text-white text-sm font-semibold hover:bg-emerald-900 disabled:opacity-50 transition-colors"
                    >
                        Confirm address
                    </button>
                </div>
            )}

            {!pin && (
                <p className="text-xs text-[#72796e] text-center py-1">
                    Search or tap the map to select your pickup location.
                </p>
            )}
        </div>
    );
}
