// ==============================
// IMPORTS (libraries + components)
// ==============================
import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Phone, Star, Search, Navigation, X } from 'lucide-react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from '@react-google-maps/api';
import { Button } from '../components/Button';

// ==============================
// MAP CONFIG (size + center)
// ==============================
const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 14.5995,
  lng: 121.0055,
};

// ==============================
// MAP OPTIONS (UI behavior)
// ==============================
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
};

// ==============================
// MAIN COMPONENT
// ==============================
export default function FindJunkshopPage() {

  // ==============================
  // STATE MANAGEMENT
  // ==============================
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredShop, setHoveredShop] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [filterMaterial, setFilterMaterial] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [map, setMap] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  // ==============================
  // GOOGLE MAPS LOADER
  // ==============================
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  // ==============================
  // STATIC JUNKSHOP DATA
  // ==============================
  const junkshops = [
    {
      id: 1,
      name: "Mang Tonio's Junkshop",
      lat: 14.5995,
      lng: 121.0055,
      distance: '0.3 km',
      address: '123 P. Sanchez St., Teresa, Sta. Mesa',
      phone: '0912-345-6789',
      hours: '8:00 AM - 6:00 PM',
      status: 'Open',
      rating: 4.8,
      materials: ['Plastic', 'Metal', 'Paper', 'Glass'],
      topPrice: 'Metal: ₱50/kg',
    },
    {
      id: 2,
      name: 'Green Recyclers Teresa',
      lat: 14.6005,
      lng: 121.0035,
      distance: '0.5 km',
      address: '456 N. Domingo St., Teresa, Sta. Mesa',
      phone: '0923-456-7890',
      hours: '7:00 AM - 7:00 PM',
      status: 'Open',
      rating: 4.6,
      materials: ['Plastic', 'Paper', 'E-waste'],
      topPrice: 'E-waste: ₱100/kg',
    },
    {
      id: 3,
      name: 'Barangay Recycle Hub',
      lat: 14.5985,
      lng: 121.0065,
      distance: '0.8 km',
      address: '789 Mayon St., Teresa, Sta. Mesa',
      phone: '0934-567-8901',
      hours: '9:00 AM - 5:00 PM',
      status: 'Closed',
      rating: 4.5,
      materials: ['Plastic', 'Metal', 'Paper', 'Glass', 'E-waste'],
      topPrice: 'All materials accepted',
    },
    {
      id: 4,
      name: 'EcoStar Junkshop',
      lat: 14.6015,
      lng: 121.0025,
      distance: '1.2 km',
      address: '321 Arayat St., Teresa, Sta. Mesa',
      phone: '0945-678-9012',
      hours: '8:30 AM - 6:30 PM',
      status: 'Open',
      rating: 4.7,
      materials: ['Metal', 'Paper', 'Cardboard'],
      topPrice: 'Metal: ₱48/kg',
    },
    {
      id: 5,
      name: 'Teresa Green Exchange',
      lat: 14.5975,
      lng: 121.0075,
      distance: '1.5 km',
      address: '555 V. Mapa St., Teresa, Sta. Mesa',
      phone: '0956-789-0123',
      hours: '8:00 AM - 5:00 PM',
      status: 'Open',
      rating: 4.9,
      materials: ['Plastic', 'Metal', 'Paper', 'Glass', 'E-waste', 'Cardboard'],
      topPrice: 'Best prices in Teresa!',
    },
  ];

  // ==============================
  // MATERIAL FILTER OPTIONS
  // ==============================
  const materials = ['all', 'Plastic', 'Metal', 'Paper', 'Glass', 'E-waste', 'Cardboard'];

  // ==============================
  // FILTER LOGIC
  // ==============================
  const filteredShops = useMemo(() => {
    return junkshops.filter((shop) => {
      if (showOpenOnly && shop.status !== 'Open') return false;
      if (filterMaterial !== 'all' && !shop.materials.includes(filterMaterial)) return false;
      if (
        searchQuery &&
        !shop.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !shop.address.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [junkshops, showOpenOnly, filterMaterial, searchQuery]);

  // ==============================
  // MAP LOAD HANDLER
  // ==============================
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // ==============================
  // FIT MAP TO MARKERS
  // ==============================
  const fitMapToMarkers = useCallback(
    (shops, currentUserLocation = null) => {
      if (!map || !window.google || shops.length === 0) return;

      const bounds = new window.google.maps.LatLngBounds();

      shops.forEach((shop) => {
        bounds.extend({ lat: shop.lat, lng: shop.lng });
      });

      if (currentUserLocation) {
        bounds.extend(currentUserLocation);
      }

      map.fitBounds(bounds);

      setTimeout(() => {
        if (map.getZoom() > 15) {
          map.setZoom(15);
        }
      }, 200);
    },
    [map]
  );

  // ==============================
  // GET USER LOCATION
  // ==============================
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserLocation(currentPos);

        if (map) {
          map.panTo(currentPos);
          map.setZoom(15);
        }
      },
      () => {
        alert('Unable to get your location. Using default area instead.');
      }
    );
  };

  // ==============================
  // DIRECTIONS FUNCTION
  // ==============================
  const handleDirections = (shop) => {
    const destination = `${shop.lat},${shop.lng}`;
    const origin = userLocation
      ? `${userLocation.lat},${userLocation.lng}`
      : '';

    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

    window.open(url, '_blank');
  };

  // ==============================
  // CALL FUNCTION
  // ==============================
  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  // ==============================
  // MARKER ICONS (OPEN / CLOSED)
  // ==============================
  { /* svg icon */ };
  const openMarkerIcon = {
    url:
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.06 27.94 0 18 0Z" fill="#3DA35D" stroke="white" stroke-width="2"/>
          <circle cx="18" cy="18" r="6" fill="white"/>
        </svg>
      `),
    scaledSize: isLoaded && window.google ? new window.google.maps.Size(36, 48) : undefined,
  };

  { /* svg icon */ };
  const closedMarkerIcon = {
    url:
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.06 27.94 0 18 0Z" fill="#9CA3AF" stroke="white" stroke-width="2"/>
          <circle cx="18" cy="18" r="6" fill="white"/>
        </svg>
      `),
    scaledSize: isLoaded && window.google ? new window.google.maps.Size(36, 48) : undefined,
  };

  // ==============================
  // ERROR STATE
  // ==============================
  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500 font-semibold">
        Failed to load Google Maps.
      </div>
    );
  }

  return (
    <div className="h-screen flex">

  {/* ==============================
        LEFT SIDEBAR: SEARCH & FILTER
  ============================== */}
  <div className="w-80 bg-white border-r border-gray-200 shadow-sm overflow-y-auto p-4">
    {/* SEARCH + FILTER CONTENT */}
    <div className="space-y-4">

      {/* Search Input + Buttons */}
      <div className="flex gap-3 mb-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search junkshops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-13 pr-3 py-2.5 rounded-[12px] border border-gray-300 text-sm text-charcoal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-eco-green focus:border-eco-green"
          />
        </div>

        <motion.button
          onClick={handleUseMyLocation}
          className="flex items-center gap-2 px-4 py-2.5 bg-clean-blue text-white rounded-[12px] hover:bg-clean-blue/90 transition-colors text-sm whitespace-nowrap"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Navigation size={18} />
          <span className="hidden sm:inline">My Location</span>
        </motion.button>
      </div>

      {/* Open Now + Material Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <label className="flex items-center gap-2 px-3 py-1.5 bg-light-gray rounded-[10px] cursor-pointer hover:bg-gray-300 transition-colors text-sm whitespace-nowrap">
          <input
            type="checkbox"
            checked={showOpenOnly}
            onChange={(e) => setShowOpenOnly(e.target.checked)}
            className="w-3.5 h-3.5 accent-eco-green"
          />
          <span>Open Now</span>
        </label>

        <select
          value={filterMaterial}
          onChange={(e) => setFilterMaterial(e.target.value)}
          className="px-3 py-1.5 bg-light-gray rounded-[10px] text-charcoal text-sm border-0 focus:outline-none focus:ring-2 focus:ring-eco-green cursor-pointer"
        >
          {materials.map((material) => (
            <option key={material} value={material}>
              {material === 'all' ? 'All Materials' : material}
            </option>
          ))}
        </select>

        <div className="flex items-center px-3 py-1.5 bg-eco-green/10 rounded-[10px]">
          <span className="text-xs font-semibold text-eco-green">
            {filteredShops.length} found
          </span>
        </div>
      </div>
    </div>
  </div>

      {/* ==============================
          GOOGLE MAP SECTION
      ============================== */}
      <div className="flex-1 relative overflow-hidden">
        {!isLoaded ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500 font-medium">Loading Google Maps...</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={userLocation || defaultCenter}
            zoom={15}
            options={mapOptions}
            onLoad={onLoad}
          >
            {/* USER LOCATION MARKER */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#3B82F6',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3,
                  scale: 8,
                }}
                title="Your Location"
              />
            )}

            {/* JUNKSHOP MARKERS */}
            {filteredShops.map((shop) => (
              <Marker
                key={shop.id}
                position={{ lat: shop.lat, lng: shop.lng }}
                icon={shop.status === 'Open' ? openMarkerIcon : closedMarkerIcon}
                onClick={() => setSelectedShop(shop)}
                title={shop.name}
              />
            ))}

            {/* INFO WINDOW (OPTIONAL HOVER) */}
            {hoveredShop && (
              <InfoWindow
                position={{ lat: hoveredShop.lat, lng: hoveredShop.lng }}
                onCloseClick={() => setHoveredShop(null)}
              >
                <div className="max-w-[180px] text-xs">
                  <h4 className="font-bold text-sm mb-1">{hoveredShop.name}</h4>
                  <p className="text-xs text-gray-600 mb-1">{hoveredShop.address}</p>
                  <p className="text-xs text-gray-600 mb-1">{hoveredShop.hours}</p>
                  <p className="text-xs font-semibold text-eco-green">
                    {hoveredShop.status}
                  </p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}

        {/* EMPTY STATE */}
        {isLoaded && filteredShops.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-white rounded-[20px] shadow-xl p-8 max-w-sm mx-4 pointer-events-auto">
              <MapPin className="mx-auto text-gray-400 mb-4" size={56} />
              <h3 className="text-lg font-bold text-charcoal mb-2">No junkshops found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters</p>
              <button
                onClick={() => {
                  setShowOpenOnly(false);
                  setFilterMaterial('all');
                  setSearchQuery('');
                }}
                className="text-eco-green font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==============================
            DETAILS MODAL (POPUP WHEN CLICKING A SHOP)
          ============================== */}
      <AnimatePresence>
        {selectedShop && (
          <>
            {/* BACKDROP OVERLAY (dark background behind modal) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedShop(null)} // click outside closes modal
              className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50"
            />

            {/* CENTERED MODAL CONTAINER */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">

              {/* MODAL CARD */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
                className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full pointer-events-auto overflow-hidden"
                onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
              >

                {/* ==============================
                      HEADER SECTION (NAME + STATUS)
                    ============================== */}
                <div className="relative bg-gradient-to-br from-eco-green to-leaf-green text-white p-6">

                  {/* CLOSE BUTTON */}
                  <button
                    onClick={() => setSelectedShop(null)}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X size={20} />
                  </button>

                  {/* SHOP NAME */}
                  <h3 className="text-2xl font-bold mb-2">
                    {selectedShop.name}
                  </h3>

                  {/* RATING + STATUS + DISTANCE */}
                  <div className="flex items-center gap-3">

                    {/* STAR RATING */}
                    <div className="flex items-center gap-1">
                      <Star className="text-sunny-yellow fill-sunny-yellow" size={18} />
                      <span className="font-semibold">
                        {selectedShop.rating}
                      </span>
                    </div>

                    {/* OPEN / CLOSED STATUS */}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${selectedShop.status === 'Open'
                        ? 'bg-white text-eco-green'
                        : 'bg-white/20 text-white'
                        }`}
                    >
                      {selectedShop.status}
                    </span>

                    {/* DISTANCE */}
                    <span className="text-sm opacity-90">
                      • {selectedShop.distance} away
                    </span>
                  </div>
                </div>

                {/* ==============================
                      DETAILS SECTION (INFO CARDS)
                    ============================== */}
                <div className="p-6 space-y-4">

                  {/* ADDRESS + HOURS + PHONE */}
                  <div className="space-y-3">

                    {/* ADDRESS */}
                    <div className="flex items-start gap-3 p-3 bg-light-gray rounded-[12px]">
                      <MapPin size={20} className="mt-0.5 flex-shrink-0 text-eco-green" />
                      <div>
                        <p className="text-sm font-semibold text-charcoal mb-1">Address</p>
                        <p className="text-sm text-gray-600">
                          {selectedShop.address}
                        </p>
                      </div>
                    </div>

                    {/* OPERATING HOURS */}
                    <div className="flex items-center gap-3 p-3 bg-light-gray rounded-[12px]">
                      <Clock size={20} className="flex-shrink-0 text-eco-green" />
                      <div>
                        <p className="text-sm font-semibold text-charcoal mb-1">Operating Hours</p>
                        <p className="text-sm text-gray-600">
                          {selectedShop.hours}
                        </p>
                      </div>
                    </div>

                    {/* CONTACT NUMBER */}
                    <div className="flex items-center gap-3 p-3 bg-light-gray rounded-[12px]">
                      <Phone size={20} className="flex-shrink-0 text-eco-green" />
                      <div>
                        <p className="text-sm font-semibold text-charcoal mb-1">Contact Number</p>
                        <p className="text-sm text-gray-600">
                          {selectedShop.phone}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* ==============================
                        MATERIALS SECTION
                      ============================== */}
                  <div>
                    <p className="font-semibold mb-2 text-charcoal">
                      Accepted Materials
                    </p>

                    {/* MATERIAL TAGS */}
                    <div className="flex flex-wrap gap-2">
                      {selectedShop.materials.map((material) => (
                        <span
                          key={material}
                          className="px-3 py-1.5 bg-leaf-green/20 text-eco-green rounded-lg text-sm font-medium"
                        >
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ==============================
                        PRICE HIGHLIGHT
                      ============================== */}
                  <div className="bg-sunny-yellow/20 border-l-4 border-sunny-yellow px-4 py-3 rounded-lg">
                    <p className="text-sm font-bold text-charcoal">
                      {selectedShop.topPrice}
                    </p>
                  </div>

                  {/* ==============================
                        ACTION BUTTONS
                      ============================== */}
                  <div className="flex gap-3 pt-2">

                    {/* DIRECTIONS BUTTON */}
                    <Button
                      className="flex-1"
                      onClick={() => handleDirections(selectedShop)}
                    >
                      <Navigation size={18} className="mr-2" />
                      Get Directions
                    </Button>

                    {/* CALL BUTTON */}
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCall(selectedShop.phone)}
                    >
                      <Phone size={18} className="mr-2" />
                      Call Now
                    </Button>

                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}