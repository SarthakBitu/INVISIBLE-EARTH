import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { AdvancedMarker, Map as GoogleMap, Pin } from '@vis.gl/react-google-maps';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  Expand,
  ExternalLink,
  Layers,
  Leaf,
  MapPin,
  Mountain,
  Pause,
  Play,
  ShieldAlert,
  ShieldCheck,
  Star,
  Train,
  Utensils,
  X,
} from 'lucide-react';
import { Destination, DestinationReview } from '../types/travel';
import { GoogleMapsViewportGuard, SectorRadiusCircle } from './MapsWrapper';

interface DestinationGuidePageProps {
  destination: Destination;
  allDestinations: Destination[];
  reviews: DestinationReview[];
  isSaved: boolean;
  currentUser: User | null;
  onOpenAuth: () => void;
  onToggleWishlist: (id: string) => void;
  onBack: () => void;
  onSelectDestination: (dest: Destination) => void;
  onPlanTrip: (dest: Destination) => void;
  onAddReview: (review: Omit<DestinationReview, 'id' | 'date'>) => Promise<void> | void;
}

export function DestinationGuidePage({
  destination,
  allDestinations,
  reviews,
  isSaved,
  currentUser,
  onOpenAuth,
  onToggleWishlist,
  onBack,
  onSelectDestination,
  onPlanTrip,
  onAddReview,
}: DestinationGuidePageProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [cinemaMotion, setCinemaMotion] = useState(true);
  const [sectorMapType, setSectorMapType] = useState<'terrain' | 'hybrid'>('terrain');
  const [reviewAuthor, setReviewAuthor] = useState(currentUser?.displayName || '');
  const [reviewLocation, setReviewLocation] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const destReviews = reviews.filter((r) => r.destinationId === destination.id);

  useEffect(() => {
    if (currentUser?.displayName && !reviewAuthor) {
      setReviewAuthor(currentUser.displayName);
    }
  }, [currentUser, reviewAuthor]);

  // Keyboard navigation for full-screen gallery lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') {
        setLightboxIdx((prev) => (prev === null ? null : (prev + 1) % destination.gallery.length));
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev - 1 + destination.gallery.length) % destination.gallery.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIdx, destination.gallery.length]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    if (!currentUser || !currentUser.emailVerified) {
      onOpenAuth();
      return;
    }
    const cleanAuthor = (reviewAuthor || currentUser.displayName || 'Explorer').trim();
    if (!cleanAuthor || reviewComment.trim().length < 3) {
      setReviewError('Please enter at least 3 characters for your field review.');
      return;
    }
    setSubmittingReview(true);
    try {
      await onAddReview({
        destinationId: destination.id,
        author: cleanAuthor,
        location: reviewLocation.trim() || 'Explorer',
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewLocation('');
      setReviewComment('');
      setReviewSubmitted(true);
      window.setTimeout(() => setReviewSubmitted(false), 4000);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Unable to save review right now.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-[#F6F4EF] text-[#141816] min-h-screen pt-16">
      {/* Cinematic Hero Banner */}
      <section className="relative h-[68vh] min-h-[460px] max-h-[720px] w-full overflow-hidden bg-[#0B0F0D]">
        <img
          src={destination.heroImage}
          alt={destination.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover ${cinemaMotion ? 'animate-ken-burns' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0D] via-[#0B0F0D]/45 to-[#0B0F0D]/55" />

        <div className="absolute inset-x-0 top-6 max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B0F0D]/75 hover:bg-[#0B0F0D] text-white text-xs font-medium border border-white/15 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explorer</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCinemaMotion((m) => !m)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0B0F0D]/75 text-white text-xs border border-white/15 hover:bg-[#0B0F0D] transition-colors cursor-pointer"
            >
              {cinemaMotion ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{cinemaMotion ? 'Pause Cinema' : 'Play Cinema'}</span>
            </button>
            <button
              type="button"
              onClick={() => setLightboxIdx(0)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0B0F0D]/75 text-white text-xs border border-white/15 hover:bg-[#0B0F0D] transition-colors cursor-pointer"
            >
              <Expand className="w-3.5 h-3.5" />
              <span>Gallery ({destination.gallery.length})</span>
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-10 max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#E4E7E4] mb-3">
            <span className="text-[#C88A36] font-semibold uppercase tracking-wider">{destination.category}</span>
            <span aria-hidden="true">·</span>
            <span>{destination.region}</span>
            <span aria-hidden="true">·</span>
            <span>{destination.country}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{destination.coordinates.formatted}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <h1 className="font-display text-3xl sm:text-5xl font-semibold text-white max-w-3xl leading-[1.08] [text-wrap:balance]">
              {destination.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onToggleWishlist(destination.id)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-[#1B4332] text-white border border-[#2D6A4F]'
                    : 'bg-white/12 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                <span>{isSaved ? 'Saved to Wishlist' : 'Save Location'}</span>
              </button>

              <button
                type="button"
                onClick={() => onPlanTrip(destination)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C88A36] hover:bg-[#D99B45] text-[#0B0F0D] text-xs font-semibold transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Plan This Expedition</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Strip */}
      <section className="bg-[#121916] text-[#F6F4EF] border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-5 grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <p className="text-xs text-[#8C9B92]">{destination.metricLabel}</p>
            <p className="mt-1 font-mono text-base font-medium tabular-nums">{destination.metricValue}</p>
          </div>
          <div>
            <p className="text-xs text-[#8C9B92]">Best Visiting Window</p>
            <p className="mt-1 text-base font-medium">{destination.bestSeason}</p>
          </div>
          <div>
            <p className="text-xs text-[#8C9B92]">Avg Temperature</p>
            <p className="mt-1 font-mono text-base font-medium tabular-nums">{destination.avgTemp} · {destination.weatherCondition}</p>
          </div>
          <div>
            <p className="text-xs text-[#8C9B92]">Difficulty Level</p>
            <p className="mt-1 text-base font-medium">{destination.difficulty}</p>
          </div>
          <div>
            <p className="text-xs text-[#8C9B92]">Estimated Daily Budget</p>
            <p className="mt-1 font-mono text-base font-medium tabular-nums text-[#C88A36]">
              ${destination.estimatedDailyBudgetUsd} / day ({destination.budgetTier})
            </p>
          </div>
        </div>
      </section>

      {/* Main Guide Content */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-12 py-14 space-y-16">
        {/* Factual Verification & Conservation Stewardship Banner */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#1B4332]/10 text-[#1B4332] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1B4332]">
                Verified Geography & Official Reference
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#141816]">
                {destination.verificationSource}
              </p>
              <p className="mt-1 text-xs text-[#5A655F] leading-relaxed">
                Coordinates, elevations, and permit regimes are cited from official registries. Seasonal temperatures and daily budgets represent historical averages and baseline estimates rather than live weather or booking feeds.
              </p>
            </div>
          </div>

          <div className="bg-[#121916] text-[#F6F4EF] border border-white/10 rounded-2xl p-6 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#C88A36]/20 text-[#C88A36] shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C88A36]">
                Place & People Protection Pledge
              </p>
              <p className="mt-1.5 text-sm text-[#E4E7E4] leading-relaxed">
                {destination.conservationStewardship}
              </p>
            </div>
          </div>
        </section>

        {/* Overview & Interactive Coordinate Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-display text-3xl font-semibold text-[#141816]">Destination Overview</h2>
            {destination.overview.map((paragraph, i) => (
              <p key={i} className="text-base text-[#3D4641] leading-relaxed">
                {paragraph}
              </p>
            ))}

            {/* Image Gallery Strip */}
            <div className="pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5A655F] mb-3">
                Expedition Gallery (Click for Fullscreen)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {destination.gallery.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIdx(idx)}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[#19231E] cursor-pointer"
                  >
                    <img
                      src={item.url}
                      alt={item.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Google Sector Map */}
          <div className="lg:col-span-5 bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#1B4332]" />
                <h3 className="font-display text-lg font-semibold">Exact Coordinates & Sector Map</h3>
              </div>
              <span className="font-mono text-xs text-[#5A655F] tabular-nums">
                {destination.coordinates.formatted}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#5A655F]" />
                {(['terrain', 'hybrid'] as const).map((layer) => (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => setSectorMapType(layer)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      sectorMapType === layer
                        ? 'bg-[#1B4332] text-white'
                        : 'bg-[#F6F4EF] text-[#3D4641] hover:bg-[#EAE5DA]'
                    }`}
                  >
                    {layer === 'terrain' ? 'Terrain Relief' : 'Hybrid Satellite'}
                  </button>
                ))}
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${destination.coordinates.lat},${destination.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F]"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Live Google Map Sector View */}
            <div className="relative rounded-xl overflow-hidden bg-[#0E1814] border border-[#E2DDD2] h-64">
              <GoogleMapsViewportGuard dark={false} heightClass="h-full">
                <GoogleMap
                  key={destination.id}
                  defaultCenter={{
                    lat: destination.coordinates.lat,
                    lng: destination.coordinates.lng,
                  }}
                  defaultZoom={11}
                  mapId="DEMO_MAP_ID"
                  mapTypeId={sectorMapType}
                  gestureHandling="cooperative"
                  streetViewControl={true}
                  mapTypeControl={false}
                  fullscreenControl={true}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  <AdvancedMarker
                    position={{
                      lat: destination.coordinates.lat,
                      lng: destination.coordinates.lng,
                    }}
                    title={destination.name}
                  >
                    <Pin background="#C88A36" borderColor="#0B0F0D" glyphColor="#0B0F0D" scale={1.15} />
                  </AdvancedMarker>
                  <SectorRadiusCircle
                    center={{
                      lat: destination.coordinates.lat,
                      lng: destination.coordinates.lng,
                    }}
                    radiusMeters={6500}
                  />
                </GoogleMap>
              </GoogleMapsViewportGuard>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5A655F] mb-3">
                Nearby Natural Attractions
              </h4>
              <div className="space-y-2.5">
                {destination.nearbyAttractions.map((near) => (
                  <div key={near.name} className="p-3 rounded-xl bg-[#F6F4EF] border border-[#E7E2D8]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#141816]">{near.name}</span>
                      <span className="font-mono text-xs text-[#1B4332] tabular-nums shrink-0">
                        {near.distanceKm} km · {near.type}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#4B544F]">{near.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weather & Seasonal Calendar + How To Reach */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-white border border-[#E2DDD2] rounded-2xl p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#1B4332]" />
              <h2 className="font-display text-2xl font-semibold">Best Time & Seasonal Weather</h2>
            </div>
            <div className="space-y-3">
              {destination.weatherProfile.map((wp) => (
                <div key={wp.season} className="p-4 rounded-xl bg-[#F6F4EF] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#141816]">
                      {wp.season} <span className="font-normal text-[#5A655F]">({wp.months})</span>
                    </p>
                    <p className="mt-1 text-xs text-[#4B544F]">{wp.summary}</p>
                  </div>
                  <span className="font-mono text-xs font-medium text-[#1B4332] tabular-nums shrink-0">
                    {wp.tempRange}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-[#E2DDD2] rounded-2xl p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-2.5">
              <Train className="w-5 h-5 text-[#1B4332]" />
              <h2 className="font-display text-2xl font-semibold">How to Reach & Transport</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="p-3.5 rounded-xl bg-[#F6F4EF]">
                <span className="text-xs text-[#5A655F]">Nearest Airport</span>
                <p className="mt-0.5 font-medium text-[#141816]">{destination.howToReach.nearestAirport}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F6F4EF]">
                <span className="text-xs text-[#5A655F]">Nearest Railway / Rail Link</span>
                <p className="mt-0.5 font-medium text-[#141816]">{destination.howToReach.nearestRailway}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F6F4EF]">
                <span className="text-xs text-[#5A655F]">Distance from Major Hub</span>
                <p className="mt-0.5 font-medium text-[#141816]">{destination.howToReach.distanceFromMajorCity}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5A655F] mb-2">Transportation Options</p>
              <ul className="space-y-1.5 text-sm text-[#3D4641]">
                {destination.howToReach.transportOptions.map((opt) => (
                  <li key={opt} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C88A36] shrink-0" />
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Stays, Dining & Adventure Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1B4332]" />
              <h3 className="font-display text-xl font-semibold">Where to Stay</h3>
            </div>
            <div className="space-y-3">
              {destination.stays.map((stay) => (
                <div key={stay.name} className="pb-3 border-b border-[#ECE8DF] last:border-none last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[#141816]">{stay.name}</p>
                    <span className="font-mono text-xs text-[#1B4332] tabular-nums">{stay.pricePerNight}/nt</span>
                  </div>
                  <p className="text-xs text-[#5A655F]">{stay.style}</p>
                  <p className="mt-1 text-xs text-[#3D4641]">{stay.highlight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#1B4332]" />
              <h3 className="font-display text-xl font-semibold">Local Food & Dining</h3>
            </div>
            <div className="space-y-3">
              {destination.dining.map((d) => (
                <div key={d.name} className="pb-3 border-b border-[#ECE8DF] last:border-none last:pb-0">
                  <p className="text-sm font-semibold text-[#141816]">{d.name}</p>
                  <p className="text-xs text-[#C88A36] font-medium">{d.cuisine}</p>
                  <p className="mt-1 text-xs text-[#3D4641]">{d.specialty}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-[#1B4332]" />
              <h3 className="font-display text-xl font-semibold">Hiking & Activities</h3>
            </div>
            <ul className="space-y-2.5 text-sm text-[#3D4641]">
              {destination.activities.map((act) => (
                <li key={act} className="p-2.5 rounded-lg bg-[#F6F4EF] font-medium text-[#141816]">
                  {act}
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-[#ECE8DF]">
              <p className="text-xs font-semibold text-[#5A655F]">Permits & Entry Fees</p>
              <p className="mt-1 text-xs text-[#3D4641] leading-relaxed">{destination.permitsAndFees}</p>
            </div>
          </div>
        </div>

        {/* Safety, Culture & Recommended Itinerary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#121916] text-[#F6F4EF] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#C88A36]">
                <ShieldAlert className="w-4 h-4" />
                <h3 className="font-display text-lg font-semibold">Safety Guidelines</h3>
              </div>
              <ul className="space-y-2 text-xs text-[#D0D7D2] leading-relaxed">
                {destination.safetyGuidelines.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C88A36] shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-3">
              <h3 className="font-display text-lg font-semibold">Local Culture & Field Etiquette</h3>
              <ul className="space-y-2 text-xs text-[#3D4641] leading-relaxed">
                {destination.localCultureTips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1B4332] shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E2DDD2] rounded-2xl p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-2xl font-semibold">Recommended Expedition Itinerary</h2>
              <button
                type="button"
                onClick={() => onPlanTrip(destination)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:text-[#C88A36] transition-colors cursor-pointer"
              >
                <span>Customize in Adventure Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {destination.recommendedItinerary.map((item) => (
                <div key={item.day} className="flex gap-4 pb-4 border-b border-[#ECE8DF] last:border-none last:pb-0">
                  <div className="w-16 shrink-0 font-mono text-xs font-semibold text-[#C88A36] pt-0.5 tabular-nums">
                    Day 0{item.day}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#141816]">{item.title}</h4>
                    <p className="mt-1 text-sm text-[#4B544F] leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explorer Reviews & Rating Section */}
        <section className="bg-white border border-[#E2DDD2] rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-display text-2xl font-semibold">Explorer Field Reviews</h2>
              {destReviews.length === 0 ? (
                <p className="text-sm text-[#5A655F]">
                  No field reports logged for this destination yet. Share the first expedition review.
                </p>
              ) : (
                <div className="space-y-4">
                  {destReviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E7E2D8]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs">
                          <span className="font-semibold text-[#141816]">{rev.author}</span>
                          <span className="text-[#5A655F]"> · {rev.location} · {rev.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#C88A36]">
                          <Star className="w-3.5 h-3.5" fill="currentColor" />
                          <span className="font-mono text-xs font-semibold tabular-nums">{rev.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-[#3D4641] leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="lg:col-span-5 bg-[#F6F4EF] rounded-xl p-5 space-y-3.5">
              <h3 className="font-display text-lg font-semibold">Rate & Review This Destination</h3>
              {!currentUser?.emailVerified && (
                <div className="p-3 rounded-lg bg-white border border-[#DCD6C8] text-xs text-[#3D4641] flex items-center justify-between gap-3">
                  <span>
                    {currentUser
                      ? 'Verify your email to publish reviews to the community cloud.'
                      : 'Sign in with a verified account to publish cloud reviews.'}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="px-3 py-1.5 rounded-lg bg-[#C88A36] text-[#0B0F0D] font-semibold shrink-0 cursor-pointer"
                  >
                    {currentUser ? 'Verify' : 'Sign In'}
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="Your Name"
                  className="bg-white border border-[#DCD6C8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1B4332]"
                />
                <input
                  type="text"
                  value={reviewLocation}
                  onChange={(e) => setReviewLocation(e.target.value)}
                  placeholder="City / Country"
                  className="bg-white border border-[#DCD6C8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="flex items-center justify-between bg-white border border-[#DCD6C8] rounded-lg px-3 py-2">
                <span className="text-xs text-[#4B544F]">Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-[#C88A36] cursor-pointer"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star className="w-4 h-4" fill={star <= reviewRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share trail conditions, wildlife sightings, or gear tips..."
                className="w-full bg-white border border-[#DCD6C8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1B4332]"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {submittingReview
                  ? 'Publishing...'
                  : currentUser?.emailVerified
                  ? 'Post Destination Review'
                  : 'Sign In to Post Review'}
              </button>

              {reviewError && <p className="text-xs text-red-700 font-medium">{reviewError}</p>}
              {reviewSubmitted && (
                <p className="text-xs text-[#1B4332] font-medium">Review synced to cloud field log.</p>
              )}
            </form>
          </div>
        </section>

        {/* Related Destinations */}
        <section className="pt-4">
          <h3 className="font-display text-2xl font-semibold mb-5">Continue Exploring Nearby Biomes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {allDestinations
              .filter((d) => d.id !== destination.id)
              .slice(0, 3)
              .map((other) => (
                <button
                  key={other.id}
                  type="button"
                  onClick={() => onSelectDestination(other)}
                  className="group text-left bg-white border border-[#E2DDD2] rounded-xl overflow-hidden hover:border-[#1B4332] transition-colors cursor-pointer"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#19231E]">
                    <img
                      src={other.heroImage}
                      alt={other.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] text-[#C88A36] font-medium">
                      {other.category} · {other.country}
                    </p>
                    <p className="mt-1 font-display text-base font-semibold text-[#141816]">{other.name}</p>
                  </div>
                </button>
              ))}
          </div>
        </section>
      </main>

      {/* Fullscreen Lightbox Modal */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-[#070B09]/95 flex flex-col justify-between p-6 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="Destination full-screen image gallery"
        >
          <div className="flex items-center justify-between text-white">
            <span className="font-mono text-xs text-[#A8B5AD] tabular-nums">
              {lightboxIdx + 1} / {destination.gallery.length} · {destination.name}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              aria-label="Close gallery"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 min-h-0">
            <button
              type="button"
              onClick={() =>
                setLightboxIdx((lightboxIdx - 1 + destination.gallery.length) % destination.gallery.length)
              }
              aria-label="Previous image"
              className="absolute left-2 md:left-4 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <img
              src={destination.gallery[lightboxIdx].url}
              alt={destination.gallery[lightboxIdx].caption}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain rounded-lg"
            />

            <button
              type="button"
              onClick={() => setLightboxIdx((lightboxIdx + 1) % destination.gallery.length)}
              aria-label="Next image"
              className="absolute right-2 md:right-4 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center text-white">
            <p className="text-sm">{destination.gallery[lightboxIdx].caption}</p>
            <p className="mt-1 font-mono text-xs text-[#8C9B92]">{destination.gallery[lightboxIdx].credit}</p>
          </div>
        </div>
      )}
    </div>
  );
}
