import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  ArrowRight,
  Bookmark,
  Compass,
  ExternalLink,
  Layers,
  Maximize2,
  Navigation,
  Search,
} from 'lucide-react';
import { Continent, Destination, NatureCategory } from '../types/travel';
import { ALL_CATEGORIES, calculateHaversineKm, estimateFlightTime } from '../data/destinations';
import { GeodesicRouteLine, GoogleMapsViewportGuard } from './MapsWrapper';

interface WorldDiscoveryMapProps {
  destinations: Destination[];
  selectedDestination: Destination | null;
  onSelectDestination: (dest: Destination) => void;
  onOpenDetails: (dest: Destination) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
}

type GoogleMapLayer = 'hybrid' | 'terrain' | 'satellite' | 'roadmap';

const MAP_LAYERS: { id: GoogleMapLayer; label: string }[] = [
  { id: 'hybrid', label: 'Hybrid Satellite' },
  { id: 'terrain', label: 'Terrain Relief' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'roadmap', label: 'Roadmap' },
];

const DEPARTURE_HUBS = [
  { id: 'london', name: 'London (LHR)', lat: 51.5072, lng: -0.1276 },
  { id: 'newyork', name: 'New York (JFK)', lat: 40.7128, lng: -74.006 },
  { id: 'tokyo', name: 'Tokyo (HND)', lat: 35.6762, lng: 139.6503 },
  { id: 'singapore', name: 'Singapore (SIN)', lat: 1.3521, lng: 103.8198 },
  { id: 'sydney', name: 'Sydney (SYD)', lat: -33.8688, lng: 151.2093 },
  { id: 'saopaulo', name: 'São Paulo (GRU)', lat: -23.5505, lng: -46.6333 },
];

function MapCameraSynchronizer({
  activeDest,
  filtered,
  fitAllSignal,
  focusSignal,
}: {
  activeDest: Destination | null;
  filtered: Destination[];
  fitAllSignal: number;
  focusSignal: number;
}) {
  const map = useMap();
  const coreLib = useMapsLibrary('core');

  // Pan to active destination when clicked in sidebar or focus requested
  useEffect(() => {
    if (!map || !activeDest) return;
    map.panTo({ lat: activeDest.coordinates.lat, lng: activeDest.coordinates.lng });
  }, [map, activeDest]);

  // Explicit close-up focus zoom when user clicks "Inspect Peak / Terrain"
  useEffect(() => {
    if (!map || !activeDest || focusSignal === 0) return;
    map.panTo({ lat: activeDest.coordinates.lat, lng: activeDest.coordinates.lng });
    map.setZoom(11);
  }, [map, activeDest, focusSignal]);

  // Fit bounds to show all filtered pins on request
  useEffect(() => {
    if (!map || !coreLib || fitAllSignal === 0 || filtered.length === 0) return;
    if (filtered.length === 1) {
      map.panTo({ lat: filtered[0].coordinates.lat, lng: filtered[0].coordinates.lng });
      map.setZoom(8);
      return;
    }
    const bounds = new coreLib.LatLngBounds();
    filtered.forEach((d) => bounds.extend({ lat: d.coordinates.lat, lng: d.coordinates.lng }));
    map.fitBounds(bounds, 48);
  }, [map, coreLib, filtered, fitAllSignal]);

  return null;
}

function DestinationPinMarker({
  destination,
  isSelected,
  isInfoOpen,
  onSelect,
  onCloseInfo,
  onOpenDetails,
}: {
  destination: Destination;
  isSelected: boolean;
  isInfoOpen: boolean;
  onSelect: () => void;
  onCloseInfo: () => void;
  onOpenDetails: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: destination.coordinates.lat, lng: destination.coordinates.lng }}
        title={`${destination.name} (${destination.country})`}
        zIndex={isSelected ? 50 : 10}
        onClick={onSelect}
      >
        <Pin
          background={isSelected ? '#C88A36' : '#1B4332'}
          borderColor={isSelected ? '#F6F4EF' : '#52B788'}
          glyphColor={isSelected ? '#0B0F0D' : '#F6F4EF'}
          scale={isSelected ? 1.25 : 0.95}
        />
      </AdvancedMarker>

      {isInfoOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={onCloseInfo} maxWidth={270}>
          <div className="p-1 text-[#141816] space-y-2">
            <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#19231E]">
              <img
                src={destination.heroImage}
                alt={destination.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B37524]">
                {destination.category} · {destination.country}
              </p>
              <h4 className="font-display text-sm font-semibold leading-snug mt-0.5">
                {destination.name}
              </h4>
              <p className="font-mono text-[11px] text-[#5A655F] mt-1 tabular-nums">
                {destination.coordinates.formatted} · {destination.metricValue}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenDetails}
              className="w-full py-1.5 px-3 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Open Full Guide
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function WorldDiscoveryMap({
  destinations,
  selectedDestination,
  onSelectDestination,
  onOpenDetails,
  wishlistIds,
  onToggleWishlist,
}: WorldDiscoveryMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | NatureCategory>('All');
  const [continentFilter, setContinentFilter] = useState<'All' | Continent>('All');
  const [selectedHubId, setSelectedHubId] = useState(DEPARTURE_HUBS[0].id);
  const [mapLayer, setMapLayer] = useState<GoogleMapLayer>('hybrid');
  const [openInfoDestId, setOpenInfoDestId] = useState<string | null>(null);
  const [fitAllSignal, setFitAllSignal] = useState(0);
  const [focusSignal, setFocusSignal] = useState(0);

  const activeHub = DEPARTURE_HUBS.find((h) => h.id === selectedHubId) ?? DEPARTURE_HUBS[0];

  const countries = useMemo(
    () => ['All', ...Array.from(new Set(destinations.map((d) => d.country))).sort()],
    [destinations]
  );

  const filtered = useMemo(() => {
    return destinations.filter((d) => {
      if (continentFilter !== 'All' && d.continent !== continentFilter) return false;
      if (countryFilter !== 'All' && d.country !== countryFilter) return false;
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hit =
          d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.region.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [destinations, continentFilter, countryFilter, categoryFilter, searchQuery]);

  const activeDest = useMemo(() => {
    if (selectedDestination && filtered.some((d) => d.id === selectedDestination.id)) {
      return selectedDestination;
    }
    return filtered[0] ?? selectedDestination ?? destinations[0];
  }, [selectedDestination, filtered, destinations]);

  // Calculate nearest natural destinations via Haversine great-circle distance
  const nearestNaturalPeers = useMemo(() => {
    if (!activeDest) return [];
    return destinations
      .filter((d) => d.id !== activeDest.id)
      .map((d) => ({
        dest: d,
        distanceKm: calculateHaversineKm(
          activeDest.coordinates.lat,
          activeDest.coordinates.lng,
          d.coordinates.lat,
          d.coordinates.lng
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
  }, [activeDest, destinations]);

  const hubDistanceKm = activeDest
    ? calculateHaversineKm(activeHub.lat, activeHub.lng, activeDest.coordinates.lat, activeDest.coordinates.lng)
    : 0;

  const handleMarkerSelect = useCallback(
    (dest: Destination) => {
      onSelectDestination(dest);
      setOpenInfoDestId(dest.id);
    },
    [onSelectDestination]
  );

  const googleMapsExternalUrl = activeDest
    ? `https://www.google.com/maps/search/?api=1&query=${activeDest.coordinates.lat},${activeDest.coordinates.lng}`
    : 'https://www.google.com/maps';

  return (
    <div className="space-y-6">
      {/* Discovery Toolbar */}
      <div className="bg-[#121916] border border-white/10 rounded-2xl p-4 md:p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 text-[#8C9B92] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search peak, river, waterfall, or region..."
            className="w-full bg-[#0B0F0D] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F6F4EF] placeholder-[#7C8B83] focus:outline-none focus:border-[#C88A36]"
          />
        </div>

        <div className="md:col-span-2">
          <select
            aria-label="Filter map by continent"
            value={continentFilter}
            onChange={(e) => setContinentFilter(e.target.value as 'All' | Continent)}
            className="w-full bg-[#0B0F0D] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-[#F6F4EF] focus:outline-none focus:border-[#C88A36]"
          >
            <option value="All">All Continents</option>
            {(['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania'] as Continent[]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            aria-label="Filter map by country"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="w-full bg-[#0B0F0D] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-[#F6F4EF] focus:outline-none focus:border-[#C88A36]"
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Countries' : c}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            aria-label="Filter map by adventure type"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'All' | NatureCategory)}
            className="w-full bg-[#0B0F0D] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-[#F6F4EF] focus:outline-none focus:border-[#C88A36]"
          >
            <option value="All">All Categories</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            aria-label="Select departure hub for directions and travel time"
            value={selectedHubId}
            onChange={(e) => setSelectedHubId(e.target.value)}
            className="w-full bg-[#1B4332]/40 border border-[#2D6A4F]/60 rounded-xl px-3 py-2.5 text-xs text-[#F6F4EF] focus:outline-none focus:border-[#C88A36]"
          >
            {DEPARTURE_HUBS.map((h) => (
              <option key={h.id} value={h.id}>
                From: {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Google Map Layer Switcher & Camera Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-[#A8B5AD] mr-1.5">
            <Layers className="w-3.5 h-3.5 text-[#C88A36]" />
            <span>Map Layer:</span>
          </span>
          {MAP_LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setMapLayer(layer.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                mapLayer === layer.id
                  ? 'bg-[#C88A36] text-[#0B0F0D] font-semibold'
                  : 'bg-[#121916] text-[#D0D7D2] border border-white/12 hover:border-white/35'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {activeDest && (
            <button
              type="button"
              onClick={() => setFocusSignal((n) => n + 1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#121916] border border-white/15 hover:border-[#C88A36] text-xs text-[#F6F4EF] transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#C88A36]" />
              <span>Zoom to Terrain (11x)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setFitAllSignal((n) => n + 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#121916] border border-white/15 hover:border-white/40 text-xs text-[#F6F4EF] transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#52B788]" />
            <span>Fit Filtered ({filtered.length})</span>
          </button>
        </div>
      </div>

      {/* Live Google Map Canvas & Directions Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-[#08151D] border border-white/10 h-[500px] lg:h-[560px]">
          <GoogleMapsViewportGuard dark={true} heightClass="h-full">
            <GoogleMap
              defaultCenter={
                activeDest
                  ? { lat: activeDest.coordinates.lat, lng: activeDest.coordinates.lng }
                  : { lat: 20, lng: 0 }
              }
              defaultZoom={3}
              mapId="DEMO_MAP_ID"
              mapTypeId={mapLayer}
              gestureHandling="greedy"
              streetViewControl={true}
              fullscreenControl={true}
              mapTypeControl={false}
              zoomControl={true}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <MapCameraSynchronizer
                activeDest={activeDest}
                filtered={filtered}
                fitAllSignal={fitAllSignal}
                focusSignal={focusSignal}
              />

              {/* Geodesic Flight Arc from Hub to Active Destination */}
              {activeDest && (
                <GeodesicRouteLine
                  origin={{ lat: activeHub.lat, lng: activeHub.lng }}
                  destination={{
                    lat: activeDest.coordinates.lat,
                    lng: activeDest.coordinates.lng,
                  }}
                />
              )}

              {/* Departure Hub Pin */}
              <AdvancedMarker
                position={{ lat: activeHub.lat, lng: activeHub.lng }}
                title={`Departure Hub: ${activeHub.name}`}
                zIndex={25}
              >
                <Pin background="#F6F4EF" borderColor="#0B0F0D" glyphColor="#0B0F0D" scale={0.9} />
              </AdvancedMarker>

              {/* Filtered Destination Advanced Markers */}
              {filtered.map((dest) => (
                <DestinationPinMarker
                  key={dest.id}
                  destination={dest}
                  isSelected={activeDest?.id === dest.id}
                  isInfoOpen={openInfoDestId === dest.id}
                  onSelect={() => handleMarkerSelect(dest)}
                  onCloseInfo={() => setOpenInfoDestId(null)}
                  onOpenDetails={() => onOpenDetails(dest)}
                />
              ))}
            </GoogleMap>
          </GoogleMapsViewportGuard>

          <div className="pointer-events-none absolute top-3 left-3 bg-[#0B0F0D]/85 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-1.5 text-xs text-[#D0D7D2] z-10">
            Showing <span className="font-mono text-white tabular-nums">{filtered.length}</span> of {destinations.length} destinations
          </div>
        </div>

        {/* Directions, Travel Time & Nearby Natural Wonders */}
        <div className="lg:col-span-4 bg-[#121916] border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          {activeDest ? (
            <>
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#C88A36] font-medium">
                      {activeDest.category} · {activeDest.country}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-semibold text-[#F6F4EF]">
                      {activeDest.name}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] text-[#8C9B92] tabular-nums">
                      {activeDest.coordinates.formatted}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleWishlist(activeDest.id)}
                    aria-label="Toggle wishlist"
                    className={`p-2.5 rounded-full border transition-colors cursor-pointer shrink-0 ${
                      wishlistIds.includes(activeDest.id)
                        ? 'bg-[#C88A36] border-[#C88A36] text-[#0B0F0D]'
                        : 'border-white/15 text-[#D0D7D2] hover:text-white'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" fill={wishlistIds.includes(activeDest.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Directions & Distance Telemetry */}
                <div className="mt-5 p-4 rounded-xl bg-[#0B0F0D] border border-white/8 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-[#A8B5AD]">
                    <Navigation className="w-3.5 h-3.5 text-[#C88A36]" />
                    <span>Geodesic Route from {activeHub.name}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-lg font-medium text-[#F6F4EF] tabular-nums">
                      {hubDistanceKm.toLocaleString()} km
                    </span>
                    <span className="font-mono text-xs text-[#52B788]">
                      {estimateFlightTime(hubDistanceKm)}
                    </span>
                  </div>
                  <p className="text-xs text-[#9CA9A1]">
                    Arrival Gateway: {activeDest.howToReach.nearestAirport}
                  </p>
                </div>

                {/* Nearby Mountains, Rivers & Wonders */}
                <div className="mt-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A8B5AD] mb-3">
                    Nearest Peaks, Rivers & Regions
                  </h4>
                  <div className="space-y-2.5">
                    {nearestNaturalPeers.map(({ dest, distanceKm }) => (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => {
                          onSelectDestination(dest);
                          setOpenInfoDestId(dest.id);
                        }}
                        className="w-full text-left p-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/8 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#F6F4EF] truncate">{dest.name}</p>
                          <p className="text-[11px] text-[#8C9B92]">
                            {dest.category} · {dest.country}
                          </p>
                        </div>
                        <span className="font-mono text-[11px] text-[#C88A36] tabular-nums shrink-0">
                          {distanceKm.toLocaleString()} km
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => onOpenDetails(activeDest)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#C88A36] hover:bg-[#D99B45] text-[#0B0F0D] text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  <span>Open Full Expedition Guide</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={googleMapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-white/15 hover:border-white/40 text-xs text-[#D0D7D2] hover:text-white transition-colors"
                >
                  <span>Open Turn-by-Turn in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <Compass className="w-8 h-8 text-[#C88A36] mx-auto mb-3" />
              <p className="text-sm text-[#A8B5AD]">No destinations match those filters. Clear filters to view the global atlas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
