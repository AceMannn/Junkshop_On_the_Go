import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search } from "lucide-react";
import { mapApi } from "../../services/api";
import { JUNKSHOP_MAP_CENTER, JUNKSHOP_MAP_ZOOM } from "./JunkshopsMap";

function pinIcon(color = "#154212") {
    return L.divIcon({
        className: "junkshop-pin-picker",
        html: `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);transform:rotate(-45deg)"></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
    });
}

export default function LocationPickerMap({
    lat,
    lng,
    onChange,
    className = "",
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [addressQuery, setAddressQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [resolving, setResolving] = useState(false);
    const searchTimerRef = useRef(null);

    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const hasPin = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

    const emitChange = useCallback(
        async (nextLat, nextLng, options = {}) => {
            if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return;

            let label = options.label;
            if (!label && options.reverse) {
                try {
                    setResolving(true);
                    const { result } = await mapApi.reverseGeocode(nextLat, nextLng);
                    label = result?.label;
                } catch {
                    label = `${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`;
                } finally {
                    setResolving(false);
                }
            }

            onChange?.({
                lat: nextLat,
                lng: nextLng,
                address: label,
            });
        },
        [onChange]
    );

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const initial = hasPin
            ? [parsedLat, parsedLng]
            : [JUNKSHOP_MAP_CENTER.lat, JUNKSHOP_MAP_CENTER.lng];

        const map = L.map(containerRef.current, {
            center: initial,
            zoom: hasPin ? 16 : JUNKSHOP_MAP_ZOOM,
            scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        if (hasPin) {
            markerRef.current = L.marker(initial, {
                draggable: true,
                icon: pinIcon(),
            }).addTo(map);

            markerRef.current.on("dragend", () => {
                const pos = markerRef.current.getLatLng();
                emitChange(pos.lat, pos.lng, { reverse: true });
            });
        }

        map.on("click", (event) => {
            const { lat: clickLat, lng: clickLng } = event.latlng;

            if (!markerRef.current) {
                markerRef.current = L.marker([clickLat, clickLng], {
                    draggable: true,
                    icon: pinIcon(),
                }).addTo(map);

                markerRef.current.on("dragend", () => {
                    const pos = markerRef.current.getLatLng();
                    emitChange(pos.lat, pos.lng, { reverse: true });
                });
            } else {
                markerRef.current.setLatLng([clickLat, clickLng]);
            }

            emitChange(clickLat, clickLng, { reverse: true });
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !hasPin) return;

        const next = [parsedLat, parsedLng];
        if (markerRef.current) {
            markerRef.current.setLatLng(next);
        } else {
            markerRef.current = L.marker(next, {
                draggable: true,
                icon: pinIcon(),
            }).addTo(map);

            markerRef.current.on("dragend", () => {
                const pos = markerRef.current.getLatLng();
                emitChange(pos.lat, pos.lng, { reverse: true });
            });
        }

        map.setView(next, Math.max(map.getZoom(), 15), { animate: true });
    }, [parsedLat, parsedLng, hasPin, emitChange]);

    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

        const q = addressQuery.trim();
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

        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [addressQuery]);

    const applySuggestion = (item) => {
        setAddressQuery(item.label);
        setSuggestions([]);
        emitChange(item.lat, item.lng, { label: item.label });
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="relative">
                <div className="flex items-center bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-2.5">
                    <Search size={18} className="text-[#72796e] shrink-0 mr-2" />
                    <input
                        type="search"
                        value={addressQuery}
                        onChange={(e) => setAddressQuery(e.target.value)}
                        placeholder="Search address in Metro Manila..."
                        className="w-full bg-transparent outline-none text-sm"
                    />
                </div>

                {suggestions.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                        {suggestions.map((item) => (
                            <li key={`${item.lat}-${item.lng}-${item.label}`}>
                                <button
                                    type="button"
                                    onClick={() => applySuggestion(item)}
                                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-emerald-50 border-b border-zinc-50 last:border-0"
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <p className="text-xs text-[#72796e] flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-700 shrink-0" />
                Tap the map or drag the pin to set your shop location.
                {searching || resolving ? " Updating…" : ""}
            </p>

            <div className="rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
                <div
                    ref={containerRef}
                    className="aspect-[16/10] min-h-[220px] w-full z-0"
                    aria-label="Shop location picker map"
                />
            </div>

            {hasPin && (
                <p className="text-xs text-[#72796e] font-mono">
                    Pin: {parsedLat.toFixed(5)}, {parsedLng.toFixed(5)}
                </p>
            )}
        </div>
    );
}
