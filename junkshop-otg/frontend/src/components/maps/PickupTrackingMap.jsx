import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, MapPin, Navigation, Truck } from "lucide-react";
import { mapApi } from "../../services/api";

function customerPinIcon() {
    return L.divIcon({
        className: "pickup-customer-pin",
        html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#154212;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);font-size:14px">📍</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

function providerPinIcon() {
    return L.divIcon({
        className: "pickup-provider-pin",
        html: `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#2563eb;border:2px solid #fff;box-shadow:0 2px 8px rgba(37,99,235,.45);font-size:15px">🚚</span>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
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

function formatLastUpdated(dateStr) {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return "Updated just now";
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `Updated ${mins} min ago`;
    return `Updated ${new Date(dateStr).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function directionsUrl(fromLat, fromLng, toLat, toLng) {
    if (Number.isFinite(fromLat) && Number.isFinite(fromLng)) {
        return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${toLat},${toLng}`;
}

export default function PickupTrackingMap({
    address = "",
    destination = null,
    provider = null,
    liveProvider = null,
    showRoute = false,
    className = "",
    minHeight = "220px",
    emptyMessage = "Map will appear when the pickup address is located.",
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const customerMarkerRef = useRef(null);
    const providerMarkerRef = useRef(null);
    const routeLayerRef = useRef(null);

    const [mapReady, setMapReady] = useState(false);
    const [resolvedDestination, setResolvedDestination] = useState(destination);
    const [geocoding, setGeocoding] = useState(false);
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);

    const providerPoint =
        liveProvider?.lat != null
            ? liveProvider
            : provider?.lat != null
              ? provider
              : null;

    useEffect(() => {
        if (destination?.lat != null && destination?.lng != null) {
            setResolvedDestination(destination);
            return;
        }

        const q = String(address || "").trim();
        if (q.length < 5) {
            setResolvedDestination(null);
            return;
        }

        let cancelled = false;
        setGeocoding(true);

        mapApi
            .geocode(q)
            .then(({ results }) => {
                if (cancelled) return;
                const hit = results?.[0];
                setResolvedDestination(
                    hit ? { lat: hit.lat, lng: hit.lng, label: hit.label } : null
                );
            })
            .catch(() => {
                if (!cancelled) setResolvedDestination(null);
            })
            .finally(() => {
                if (!cancelled) setGeocoding(false);
            });

        return () => {
            cancelled = true;
        };
    }, [address, destination]);

    const refreshMapSize = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;
        window.requestAnimationFrame(() => {
            map.invalidateSize({ pan: false });
        });
    }, []);

    useLayoutEffect(() => {
        if (!resolvedDestination?.lat || !containerRef.current) return;
        if (mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [resolvedDestination.lat, resolvedDestination.lng],
            zoom: 15,
            scrollWheelZoom: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        mapRef.current = map;
        setMapReady(true);

        return () => {
            map.remove();
            mapRef.current = null;
            customerMarkerRef.current = null;
            providerMarkerRef.current = null;
            routeLayerRef.current = null;
            setMapReady(false);
        };
    }, [resolvedDestination?.lat, resolvedDestination?.lng]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady || !resolvedDestination?.lat) return;

        const destLatLng = [resolvedDestination.lat, resolvedDestination.lng];

        if (customerMarkerRef.current) {
            customerMarkerRef.current.setLatLng(destLatLng);
        } else {
            customerMarkerRef.current = L.marker(destLatLng, {
                icon: customerPinIcon(),
            }).addTo(map);
            customerMarkerRef.current.bindPopup("Customer pickup");
        }

        if (providerPoint?.lat != null) {
            const provLatLng = [providerPoint.lat, providerPoint.lng];
            if (providerMarkerRef.current) {
                providerMarkerRef.current.setLatLng(provLatLng);
            } else {
                providerMarkerRef.current = L.marker(provLatLng, {
                    icon: providerPinIcon(),
                }).addTo(map);
                providerMarkerRef.current.bindPopup("Provider");
            }
        } else if (providerMarkerRef.current) {
            map.removeLayer(providerMarkerRef.current);
            providerMarkerRef.current = null;
        }

        const boundsPoints = [destLatLng];
        if (providerPoint?.lat != null) {
            boundsPoints.push([providerPoint.lat, providerPoint.lng]);
        }

        if (boundsPoints.length > 1) {
            map.fitBounds(L.latLngBounds(boundsPoints), { padding: [36, 36], maxZoom: 16 });
        } else {
            map.setView(destLatLng, 15);
        }

        refreshMapSize();
    }, [mapReady, resolvedDestination, providerPoint, refreshMapSize]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !mapReady) return;

        const observer = new ResizeObserver(refreshMapSize);
        observer.observe(container);

        return () => observer.disconnect();
    }, [mapReady, refreshMapSize]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady || !showRoute || !resolvedDestination?.lat || !providerPoint?.lat) {
            if (routeLayerRef.current && mapRef.current) {
                mapRef.current.removeLayer(routeLayerRef.current);
                routeLayerRef.current = null;
            }
            setRouteInfo(null);
            return;
        }

        let cancelled = false;
        setRouteLoading(true);

        mapApi
            .route(
                providerPoint.lat,
                providerPoint.lng,
                resolvedDestination.lat,
                resolvedDestination.lng
            )
            .then(({ route }) => {
                if (cancelled || !mapRef.current) return;

                if (routeLayerRef.current) {
                    mapRef.current.removeLayer(routeLayerRef.current);
                }

                routeLayerRef.current = L.geoJSON(route.geometry, {
                    style: { color: "#2563eb", weight: 4, opacity: 0.85 },
                }).addTo(mapRef.current);

                setRouteInfo({
                    distance: formatDistance(route.distanceMeters),
                    duration: formatDuration(route.durationSeconds),
                });
            })
            .catch(() => {
                if (!cancelled) setRouteInfo(null);
            })
            .finally(() => {
                if (!cancelled) setRouteLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [
        mapReady,
        showRoute,
        resolvedDestination?.lat,
        resolvedDestination?.lng,
        providerPoint?.lat,
        providerPoint?.lng,
    ]);

    const lastUpdated = formatLastUpdated(provider?.updatedAt);
    const navUrl =
        resolvedDestination?.lat != null
            ? directionsUrl(
                  providerPoint?.lat,
                  providerPoint?.lng,
                  resolvedDestination.lat,
                  resolvedDestination.lng
              )
            : null;

    if (!resolvedDestination?.lat && !geocoding) {
        return (
            <div
                className={`rounded-xl border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center text-center px-4 ${className}`}
                style={{ minHeight }}
            >
                <p className="text-sm text-[#72796e]">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`min-w-0 max-w-full space-y-2 ${className}`}>
            <div className="relative min-w-0 max-w-full overflow-hidden rounded-xl border border-zinc-200 shadow-sm bg-zinc-100">
                {geocoding && (
                    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/80 text-sm text-[#72796e]">
                        Locating address…
                    </div>
                )}
                <div ref={containerRef} className="w-full max-w-full min-w-0" style={{ minHeight }} />

                <div className="absolute top-2 left-2 right-2 z-[400] flex flex-wrap gap-1.5 pointer-events-none">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-[#154212] shadow-sm">
                        <MapPin size={12} /> Customer
                    </span>
                    {providerPoint && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 border border-blue-200 px-2 py-1 text-[10px] font-semibold text-blue-700 shadow-sm">
                            <Truck size={12} /> Provider
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-[#72796e] space-x-2">
                    {lastUpdated && <span>{lastUpdated}</span>}
                    {routeLoading && <span>Calculating route…</span>}
                    {routeInfo && (
                        <span className="font-semibold text-blue-700">
                            {routeInfo.distance} · ~{routeInfo.duration}
                        </span>
                    )}
                </div>
                {navUrl && (
                    <a
                        href={navUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
                    >
                        <Navigation size={14} />
                        Navigate
                        <ExternalLink size={12} />
                    </a>
                )}
            </div>
        </div>
    );
}

export { directionsUrl, formatLastUpdated };
