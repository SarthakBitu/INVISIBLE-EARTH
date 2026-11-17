import { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { Bookmark, Calendar, Check, Share2, ShieldCheck, Trash2, Users, Wallet } from 'lucide-react';
import { BudgetTier, Destination, SavedPlanRecord } from '../types/travel';

interface AdventurePlannerPageProps {
  destinations: Destination[];
  initialDestinationId?: string;
  currentUser: User | null;
  savedPlans: SavedPlanRecord[];
  onSavePlan: (plan: Omit<SavedPlanRecord, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
  onOpenAuth: () => void;
  onShareItineraryToCommunity: (payload: {
    destination: Destination;
    title: string;
    summary: string;
    body: string;
  }) => Promise<void> | void;
  onOpenDetails: (dest: Destination) => void;
}

type PartyType = 'Solo' | 'Couple' | 'Friends' | 'Family';

const EXTRA_ACTIVITIES = [
  'Sunrise Photography',
  'Guided Backcountry Trek',
  'Kayaking & Paddle',
  'Wildlife & Birding',
  'Cultural Village Immersion',
  'Astrophotography & Dark Sky',
];

export function AdventurePlannerPage({
  destinations,
  initialDestinationId,
  currentUser,
  savedPlans,
  onSavePlan,
  onDeletePlan,
  onOpenAuth,
  onShareItineraryToCommunity,
  onOpenDetails,
}: AdventurePlannerPageProps) {
  const [selectedId, setSelectedId] = useState(initialDestinationId || destinations[0].id);
  const [startDate, setStartDate] = useState('2026-11-20');
  const [endDate, setEndDate] = useState('2026-11-25');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('Mid-Range');
  const [partyType, setPartyType] = useState<PartyType>('Couple');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    'Sunrise Photography',
    'Guided Backcountry Trek',
  ]);
  const [sharedSuccess, setSharedSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const destination = useMemo(
    () => destinations.find((d) => d.id === selectedId) ?? destinations[0],
    [destinations, selectedId]
  );

  const tripDays = useMemo(() => {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 4;
    return Math.min(14, Math.max(2, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1));
  }, [startDate, endDate]);

  const partyCount = partyType === 'Solo' ? 1 : partyType === 'Couple' ? 2 : 4;
  const tierMultiplier = budgetTier === 'Budget' ? 0.72 : budgetTier === 'Luxury' ? 1.65 : 1.0;

  const expenseBreakdown = useMemo(() => {
    const dailyBase = destination.estimatedDailyBudgetUsd * tierMultiplier;
    const staysTotal = Math.round(dailyBase * 0.46 * tripDays * (partyType === 'Solo' ? 1 : partyCount * 0.65));
    const transportTotal = Math.round(dailyBase * 0.22 * tripDays * partyCount);
    const diningTotal = Math.round(dailyBase * 0.18 * tripDays * partyCount);
    const guidesAndPermits = Math.round(
      (dailyBase * 0.14 * tripDays + selectedActivities.length * 45) * partyCount
    );
    const total = staysTotal + transportTotal + diningTotal + guidesAndPermits;
    return { staysTotal, transportTotal, diningTotal, guidesAndPermits, total };
  }, [destination, tierMultiplier, tripDays, partyType, partyCount, selectedActivities.length]);

  const generatedItinerary = useMemo(() => {
    const baseDays = destination.recommendedItinerary;
    const result = [];
    for (let day = 1; day <= tripDays; day++) {
      if (day <= baseDays.length) {
        result.push({
          day,
          title: baseDays[day - 1].title,
          description: `${baseDays[day - 1].description} Tailored for ${partyType.toLowerCase()} pace (${budgetTier.toLowerCase()} comfort).`,
        });
      } else if (day === tripDays) {
        result.push({
          day,
          title: 'Final Morning Vista & Departure Transfer',
          description: `Last golden hour overlook near ${destination.stays[0]?.name || destination.region} before connecting to ${destination.howToReach.nearestAirport}.`,
        });
      } else {
        const extraActivity = selectedActivities[(day - 1) % Math.max(1, selectedActivities.length)] || 'Explorer Day';
        const nearby = destination.nearbyAttractions[(day - 1) % Math.max(1, destination.nearbyAttractions.length)];
        result.push({
          day,
          title: `${extraActivity}${nearby ? ` · ${nearby.name}` : ''}`,
          description: nearby
            ? `Dedicated excursion ${nearby.distanceKm} km from basecamp to experience ${nearby.note}`
            : `Flexible wilderness day exploring local trails and cuisine around ${destination.region}.`,
        });
      }
    }
    return result;
  }, [destination, tripDays, partyType, budgetTier, selectedActivities]);

  const toggleActivity = (act: string) => {
    setSelectedActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleSaveCloudPlan = async () => {
    setActionError(null);
    if (!currentUser || !currentUser.emailVerified) {
      onOpenAuth();
      return;
    }
    setActionBusy(true);
    try {
      await onSavePlan({
        destinationId: destination.id,
        destinationName: destination.name,
        startDate,
        endDate,
        budgetTier,
        partyType,
        activities: selectedActivities.slice(0, 12),
        estimatedTotalUsd: expenseBreakdown.total,
      });
      setSavedSuccess(true);
      window.setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save expedition plan.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleShare = async () => {
    setActionError(null);
    if (!currentUser || !currentUser.emailVerified) {
      onOpenAuth();
      return;
    }
    setActionBusy(true);
    try {
      const summary = `${tripDays}-Day ${destination.name.split('&')[0].trim()} · ${partyType} · ${budgetTier} (~$${expenseBreakdown.total.toLocaleString()})`;
      const body = generatedItinerary
        .map((d) => `Day ${d.day}: ${d.title} — ${d.description}`)
        .join('\n\n');

      await onShareItineraryToCommunity({
        destination,
        title: `${tripDays}-Day ${partyType} Expedition to ${destination.name}`,
        summary,
        body,
      });
      setSharedSuccess(true);
      window.setTimeout(() => setSharedSuccess(false), 5000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to publish itinerary.');
    } finally {
      setActionBusy(false);
    }
  };

  const loadSavedPlan = (plan: SavedPlanRecord) => {
    setSelectedId(plan.destinationId);
    setStartDate(plan.startDate);
    setEndDate(plan.endDate);
    setBudgetTier(plan.budgetTier);
    setPartyType(plan.partyType);
    setSelectedActivities(plan.activities);
  };

  return (
    <div className="bg-[#F6F4EF] text-[#141816] min-h-screen pt-24 pb-20">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="max-w-3xl mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C88A36] mb-3">
            Expedition Configurator
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-[#141816]">
            Adventure Planner
          </h1>
          <p className="mt-4 text-base text-[#4B544F] leading-relaxed">
            Configure your destination, dates, travel style, and budget to generate a tailored expedition itinerary and itemized expense forecast.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Configuration Controls */}
          <div className="lg:col-span-5 bg-white border border-[#E2DDD2] rounded-2xl p-6 md:p-7 space-y-6">
            <div>
              <label htmlFor="planner-dest" className="block text-xs font-semibold uppercase tracking-wider text-[#5A655F] mb-2">
                1. Destination
              </label>
              <select
                id="planner-dest"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-4 py-3 text-sm font-medium text-[#141816] focus:outline-none focus:border-[#1B4332]"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.country})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="start-date" className="block text-xs font-semibold uppercase tracking-wider text-[#5A655F] mb-2">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-3 py-2.5 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-xs font-semibold uppercase tracking-wider text-[#5A655F] mb-2">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#F6F4EF] border border-[#DCD6C8] rounded-xl px-3 py-2.5 text-sm font-mono tabular-nums"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5A655F] mb-2">
                2. Budget Comfort
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['Budget', 'Mid-Range', 'Luxury'] as BudgetTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setBudgetTier(tier)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      budgetTier === tier
                        ? 'bg-[#1B4332] text-white'
                        : 'bg-[#F6F4EF] text-[#3D4641] hover:bg-[#ECE8DF]'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5A655F] mb-2">
                3. Travel Companions
              </p>
              <div className="grid grid-cols-4 gap-2">
                {(['Solo', 'Couple', 'Friends', 'Family'] as PartyType[]).map((party) => (
                  <button
                    key={party}
                    type="button"
                    onClick={() => setPartyType(party)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      partyType === party
                        ? 'bg-[#C88A36] text-[#0B0F0D]'
                        : 'bg-[#F6F4EF] text-[#3D4641] hover:bg-[#ECE8DF]'
                    }`}
                  >
                    {party}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5A655F] mb-2">
                4. Adventure Activities
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[...destination.activities.slice(0, 2), ...EXTRA_ACTIVITIES.slice(0, 4)].map((act) => {
                  const active = selectedActivities.includes(act);
                  return (
                    <button
                      key={act}
                      type="button"
                      onClick={() => toggleActivity(act)}
                      className={`text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1B4332]/10 border-[#1B4332] text-[#141816] font-semibold'
                          : 'bg-[#F6F4EF] border-transparent text-[#4B544F] hover:border-[#DCD6C8]'
                      }`}
                    >
                      <span className="truncate">{act}</span>
                      {active && <Check className="w-3.5 h-3.5 text-[#1B4332] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Generated Itinerary & Expenses */}
          <div className="lg:col-span-7 space-y-6">
            {/* Summary Banner */}
            <div className="bg-[#121916] text-[#F6F4EF] rounded-2xl p-6 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-3 text-xs text-[#C88A36] font-mono tabular-nums mb-1">
                  <span>{tripDays} Days</span>
                  <span>·</span>
                  <span>{partyType} ({partyCount} travelers)</span>
                  <span>·</span>
                  <span>{budgetTier}</span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-semibold">{destination.name}</h2>
                <button
                  type="button"
                  onClick={() => onOpenDetails(destination)}
                  className="mt-2 text-xs text-[#A8B5AD] underline hover:text-white cursor-pointer"
                >
                  Inspect Full Destination Guide
                </button>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs text-[#8C9B92]">Estimated Total</span>
                <p className="font-mono text-3xl font-semibold text-[#C88A36] tabular-nums">
                  ${expenseBreakdown.total.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Itemized Expense Breakdown */}
            <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-[#1B4332]" />
                <h3 className="font-display text-xl font-semibold">Estimated Expedition Expenses</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-[#F6F4EF]">
                  <span className="text-xs text-[#5A655F]">Accommodation</span>
                  <p className="mt-1 font-mono text-base font-semibold tabular-nums">
                    ${expenseBreakdown.staysTotal.toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F6F4EF]">
                  <span className="text-xs text-[#5A655F]">Local Transport</span>
                  <p className="mt-1 font-mono text-base font-semibold tabular-nums">
                    ${expenseBreakdown.transportTotal.toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F6F4EF]">
                  <span className="text-xs text-[#5A655F]">Dining & Food</span>
                  <p className="mt-1 font-mono text-base font-semibold tabular-nums">
                    ${expenseBreakdown.diningTotal.toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F6F4EF]">
                  <span className="text-xs text-[#5A655F]">Guides & Permits</span>
                  <p className="mt-1 font-mono text-base font-semibold tabular-nums">
                    ${expenseBreakdown.guidesAndPermits.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Suggested Day-by-Day Itinerary */}
            <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6 md:p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1B4332]" />
                  <h3 className="font-display text-xl font-semibold">Suggested Day-by-Day Itinerary</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleSaveCloudPlan}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C88A36] hover:bg-[#D99B45] text-[#0B0F0D] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{currentUser?.emailVerified ? 'Save to Account' : 'Sign In to Save'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share to Community</span>
                  </button>
                </div>
              </div>

              {actionError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium">
                  {actionError}
                </div>
              )}

              {savedSuccess && (
                <div className="p-3 rounded-xl bg-[#1B4332]/10 border border-[#1B4332]/30 text-xs text-[#1B4332] font-medium">
                  Expedition plan saved to your cloud account!
                </div>
              )}

              {sharedSuccess && (
                <div className="p-3 rounded-xl bg-[#1B4332]/10 border border-[#1B4332]/30 text-xs text-[#1B4332] font-medium">
                  Itinerary published to the Travel Stories community feed!
                </div>
              )}

              <div className="space-y-4">
                {generatedItinerary.map((day) => (
                  <div key={day.day} className="flex gap-4 pb-4 border-b border-[#ECE8DF] last:border-none last:pb-0">
                    <span className="font-mono text-xs font-semibold text-[#C88A36] w-14 pt-0.5 shrink-0 tabular-nums">
                      Day {String(day.day).padStart(2, '0')}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-[#141816]">{day.title}</h4>
                      <p className="mt-1 text-sm text-[#4B544F] leading-relaxed">{day.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accommodation & Transport Match */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white border border-[#E2DDD2] rounded-2xl p-5">
                <h4 className="font-display text-lg font-semibold mb-3">Recommended Stays</h4>
                <div className="space-y-3">
                  {destination.stays.map((stay) => (
                    <div key={stay.name} className="text-xs">
                      <div className="flex justify-between font-semibold text-[#141816]">
                        <span>{stay.name}</span>
                        <span className="font-mono text-[#1B4332] tabular-nums">{stay.pricePerNight}/nt</span>
                      </div>
                      <p className="text-[#5A655F]">{stay.highlight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E2DDD2] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-[#1B4332]" />
                  <h4 className="font-display text-lg font-semibold">Access & Logistics</h4>
                </div>
                <p className="text-xs text-[#3D4641] font-medium mb-2">
                  Gateway: {destination.howToReach.nearestAirport}
                </p>
                <ul className="space-y-1.5 text-xs text-[#4B544F]">
                  {destination.howToReach.transportOptions.map((opt) => (
                    <li key={opt}>· {opt}</li>
                  ))}
                </ul>
                <p className="mt-3 pt-2.5 border-t border-[#ECE8DF] text-[11px] text-[#5A655F] flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1B4332] shrink-0 mt-0.5" />
                  <span>{destination.conservationStewardship}</span>
                </p>
              </div>
            </div>

            {/* Cloud Saved Expeditions */}
            <div className="bg-white border border-[#E2DDD2] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-semibold">Your Saved Cloud Expeditions</h3>
                {!currentUser?.emailVerified && (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="text-xs font-semibold text-[#1B4332] underline cursor-pointer"
                  >
                    {currentUser ? 'Verify Email to Sync' : 'Sign In to Sync'}
                  </button>
                )}
              </div>

              {savedPlans.length === 0 ? (
                <p className="text-xs text-[#5A655F]">
                  {currentUser?.emailVerified
                    ? 'No saved expedition plans yet. Configure a trip and click “Save to Account” to store it here.'
                    : 'Sign in with a verified email to save and reload multiple expedition itineraries across devices.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {savedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-3.5 rounded-xl bg-[#F6F4EF] border border-[#E7E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#141816]">{plan.destinationName}</p>
                        <p className="text-xs text-[#5A655F] font-mono tabular-nums mt-0.5">
                          {plan.startDate} → {plan.endDate} · {plan.partyType} · {plan.budgetTier} · ~$
                          {plan.estimatedTotalUsd.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => loadSavedPlan(plan)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-semibold cursor-pointer"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePlan(plan.id)}
                          aria-label="Delete saved plan"
                          className="p-1.5 rounded-lg border border-[#DCD6C8] text-[#5A655F] hover:text-red-700 hover:border-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
