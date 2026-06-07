import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, LocateFixed, MapPin, Navigation, Search } from "lucide-react";
import { mapApi } from "../../services/api";

/** Teresa / Sta. Mesa default; map pans across Metro Manila. */
export const JUNKSHOP_MAP_CENTER = { lat: 14.5995, lng: 121.0055 };
export const JUNKSHOP_MAP_ZOOM = 13;

function directionsUrl(fromLat, fromLng, toLat, toLng) {
    if (Number.isFinite(fromLat) && Number.isFinite(fromLng)) {
        return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${toLat},${toLng}`;
}

function formatDistance(meters) {
    if (!Number.isFinite(meters)) return "";
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) return "";
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hours}h ${rem}m`;
}

function shopPinIcon(isOpen, selected) {
    const color = selected ? "#0d9488" : isOpen ? "#154212" : "#72796e";
    const size = selected ? 18 : 14;
    return L.divIcon({
        className: "junkshop-pin",
        html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25)"></span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

function originPinIcon() {
    return L.divIcon({
        className: "junkshop-origin-pin",
        html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:#2563eb;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25)"></span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });
}

function popupHtml(shop) {
    const lat = Number(shop.lat);
    const lng = Number(shop.lng);
    return `
      <div style="min-width:180px;font-family:system-ui,sans-serif">
        <p style="margin:0;font-weight:700;font-size:14px;color:#191c1c">${shop.name}</p>
        <p style="margin:6px 0 0;font-size:12px;color:#72796e;line-height:1.4">${shop.address}</p>
        <p style="margin:6px 0 0;font-size:12px;font-weight:600;color:#154212">${shop.status}${shop.rating ? ` · ★ ${shop.rating}` : ""}</p>
        <a href="${directionsUrl(null, null, lat, lng)}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#154212">Open in Google Maps →</a>
      </div>
    `;
}

export default function JunkshopsMap({
    shops = [],
    selectedId = null,
    onSelectShop,
    className = "",
    routingEnabled = false,
    autoRouteShopId = null,
    onRouteDrawn,
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const originMarkerRef = useRef(null);
    const routeLayerRef = useRef(null);
    const searchTimerRef = useRef(null);

    const [mapReady, setMapReady] = useState(false);
    const [origin, setOrigin] = useState(null);
    const [originQuery, setOriginQuery] = useState("");
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [originLoading, setOriginLoading] = useState(false);
    const [gpsStatus, setGpsStatus] = useState("idle");
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeError, setRouteError] = useState("");

    const mappableShops = useMemo(
        () =>
            shops.filter(
                (shop) =>
                    Number.isFinite(Number(shop.lat)) && Number.isFinite(Number(shop.lng))
            ),
        [shops]
    );

    const routeTargetId = autoRouteShopId || selectedId;

    const setOriginPoint = useCallback((point) => {
        setOrigin(point);
        setRouteError("");
    }, []);

    const requestGpsOrigin = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsStatus("unsupported");
            return;
        }

        setGpsStatus("loading");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setOriginPoint({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    label: "Your current location",
                    source: "gps",
                });
                setGpsStatus("ready");
            },
            () => {
                setGpsStatus("denied");
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
        );
    }, [setOriginPoint]);

    useEffect(() => {
        if (!routingEnabled) return;
        requestGpsOrigin();
    }, [routingEnabled, requestGpsOrigin]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [JUNKSHOP_MAP_CENTER.lat, JUNKSHOP_MAP_CENTER.lng],
            zoom: JUNKSHOP_MAP_ZOOM,
            scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        setMapReady(true);

        return () => {
            map.remove();
            mapRef.current = null;
            markersRef.current = [];
            originMarkerRef.current = null;
            routeLayerRef.current = null;
            setMapReady(false);
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        mappableShops.forEach((shop) => {
            const isOpen = String(shop.status).toLowerCase() === "open";
            const selected = shop.id === selectedId;
            const marker = L.marker([Number(shop.lat), Number(shop.lng)], {
                icon: shopPinIcon(isOpen, selected),
            }).addTo(map);

            marker.bindPopup(popupHtml(shop));
            marker.on("click", () => onSelectShop?.(shop.id));

            if (selected) {
                marker.openPopup();
            }

            markersRef.current.push(marker);
        });

        if (!routeLayerRef.current && mappableShops.length > 0 && !routingEnabled) {
            if (mappableShops.length > 1) {
                const bounds = L.latLngBounds(
                    mappableShops.map((s) => [Number(s.lat), Number(s.lng)])
                );
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
            } else {
                const s = mappableShops[0];
                map.setView([Number(s.lat), Number(s.lng)], 15);
            }
        }
    }, [mappableShops, selectedId, mapReady, onSelectShop, routingEnabled]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady || !routingEnabled || !origin) return;

        if (originMarkerRef.current) {
            originMarkerRef.current.setLatLng([origin.lat, origin.lng]);
        } else {
            originMarkerRef.current = L.marker([origin.lat, origin.lng], {
                icon: originPinIcon(),
            }).addTo(map);
            originMarkerRef.current.bindPopup(origin.label || "Start");
        }
    }, [origin, mapReady, routingEnabled]);

    const drawRoute = useCallback(
        async (targetShop) => {
            const map = mapRef.current;
            if (!map || !origin || !targetShop) return;

            setRouteLoading(true);
            setRouteError("");

            try {
                const { route } = await mapApi.route(
                    origin.lat,
                    origin.lng,
                    Number(targetShop.lat),
                    Number(targetShop.lng)
                );

                if (routeLayerRef.current) {
                    routeLayerRef.current.remove();
                }

                routeLayerRef.current = L.geoJSON(route.geometry, {
                    style: {
                        color: "#2563eb",
                        weight: 5,
                        opacity: 0.85,
                    },
                }).addTo(map);

                const bounds = routeLayerRef.current.getBounds();
                if (originMarkerRef.current) {
                    bounds.extend(originMarkerRef.current.getLatLng());
                }
                map.fitBounds(bounds, { padding: [48, 48] });

                const info = {
                    distanceMeters: route.distanceMeters,
                    durationSeconds: route.durationSeconds,
                    shopId: targetShop.id,
                };
                setRouteInfo(info);
                onRouteDrawn?.(info);
            } catch (err) {
                setRouteError(err.message || "Could not draw route.");
                setRouteInfo(null);
            } finally {
                setRouteLoading(false);
            }
        },
        [origin, onRouteDrawn]
    );

    useEffect(() => {
        if (!routingEnabled || !routeTargetId || !origin) return;
        const shop = mappableShops.find((s) => s.id === routeTargetId);
        if (!shop) return;
        drawRoute(shop);
    }, [routingEnabled, routeTargetId, origin, mappableShops, drawRoute]);

    useEffect(() => {
        if (!selectedId || !mapRef.current) return;
        const shop = mappableShops.find((s) => s.id === selectedId);
        if (!shop) return;
        mapRef.current.setView([Number(shop.lat), Number(shop.lng)], 16, { animate: true });
        const marker = markersRef.current.find((m) => {
            const latLng = m.getLatLng();
            return (
                latLng.lat === Number(shop.lat) && latLng.lng === Number(shop.lng)
            );
        });
        marker?.openPopup();
    }, [selectedId, mappableShops]);

    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

        const q = originQuery.trim();
        if (!routingEnabled || q.length < 3) {
            setOriginSuggestions([]);
            return;
        }

        searchTimerRef.current = setTimeout(async () => {
            try {
                setOriginLoading(true);
                const { results } = await mapApi.geocode(q);
                setOriginSuggestions(results || []);
            } catch {
                setOriginSuggestions([]);
            } finally {
                setOriginLoading(false);
            }
        }, 450);

        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [originQuery, routingEnabled]);

    const applyOriginSuggestion = (item) => {
        setOriginQuery(item.label);
        setOriginSuggestions([]);
        setOriginPoint({
            lat: item.lat,
            lng: item.lng,
            label: item.label,
            source: "search",
        });
        setGpsStatus("idle");
    };

    if (mappableShops.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 min-h-[200px] flex items-center justify-center text-sm text-[#72796e] p-6 text-center">
                No shop locations to show. Partner shops appear here after providers complete setup.
            </div>
        );
    }

    const selectedShop = mappableShops.find((s) => s.id === routeTargetId);

    return (
        <div className={`space-y-3 ${className}`}>
            {routingEnabled && (
                <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 sm:p-4">
                    <p className="text-xs font-semibold text-[#42493e]">Your starting point</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <div className="flex items-center bg-white border border-[#c2c9bb] rounded-xl px-3 py-2.5">
                                <Search size={16} className="text-[#72796e] shrink-0 mr-2" />
                                <input
                                    type="search"
                                    value={originQuery}
                                    onChange={(e) => setOriginQuery(e.target.value)}
                                    placeholder="Search any Metro Manila address..."
                                    className="w-full bg-transparent outline-none text-sm"
                                />
                            </div>
                            {originSuggestions.length > 0 && (
                                <ul className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                                    {originSuggestions.map((item) => (
                                        <li key={`${item.lat}-${item.lng}-${item.label}`}>
                                            <button
                                                type="button"
                                                onClick={() => applyOriginSuggestion(item)}
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
                            onClick={requestGpsOrigin}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#154212] hover:bg-emerald-50 shrink-0"
                        >
                            <LocateFixed size={16} />
                            Use my location
                        </button>
                    </div>
                    {origin && (
                        <p className="text-xs text-[#72796e] truncate">
                            From: {origin.label}
                            {originLoading ? " · Searching…" : ""}
                        </p>
                    )}
                    {gpsStatus === "denied" && (
                        <p className="text-xs text-amber-800">
                            Location blocked — search an address above instead.
                        </p>
                    )}
                    {gpsStatus === "unsupported" && (
                        <p className="text-xs text-amber-800">
                            GPS not available — search your address above.
                        </p>
                    )}
                </div>
            )}

            <p className="text-xs text-[#72796e] flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-700 shrink-0" />
                Free map — partner junkshop pins only. Metro Manila.
                {routingEnabled && " · Routes via OSRM (free)."}
            </p>

            <div className="rounded-xl border border-emerald-200 overflow-hidden shadow-sm z-0">
                <div
                    ref={containerRef}
                    className="aspect-[16/9] min-h-[280px] sm:min-h-[320px] w-full z-0 [&_.leaflet-control-attribution]:text-[10px]"
                    aria-label="Junkshop locations map"
                />
            </div>

            {routingEnabled && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-xs text-[#72796e] space-y-0.5">
                        {routeLoading && <p>Calculating route…</p>}
                        {routeInfo && !routeLoading && (
                            <p className="font-semibold text-[#154212]">
                                {formatDistance(routeInfo.distanceMeters)} ·{" "}
                                {formatDuration(routeInfo.durationSeconds)} drive
                            </p>
                        )}
                        {routeError && <p className="text-red-600">{routeError}</p>}
                        {!origin && !routeLoading && (
                            <p>Use GPS or search an address to see a route.</p>
                        )}
                    </div>

                    {selectedShop && origin && (
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => drawRoute(selectedShop)}
                                disabled={routeLoading}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#154212] hover:underline disabled:opacity-60"
                            >
                                <Navigation size={12} />
                                Refresh route
                            </button>
                            <a
                                href={directionsUrl(
                                    origin.lat,
                                    origin.lng,
                                    Number(selectedShop.lat),
                                    Number(selectedShop.lng)
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#154212] hover:underline"
                            >
                                <ExternalLink size={12} />
                                Open in Google Maps
                            </a>
                        </div>
                    )}
                </div>
            )}

            {!routingEnabled && selectedId && (
                <a
                    href={(() => {
                        const s = mappableShops.find((x) => x.id === selectedId);
                        return s
                            ? directionsUrl(null, null, Number(s.lat), Number(s.lng))
                            : "#";
                    })()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#154212] hover:underline"
                >
                    <ExternalLink size={12} />
                    Open directions in Google Maps
                </a>
            )}

            <p className="text-[10px] text-[#72796e]">
                © OpenStreetMap contributors
                {routingEnabled ? " · Routing by OSRM" : ""}
            </p>
        </div>
    );
}
