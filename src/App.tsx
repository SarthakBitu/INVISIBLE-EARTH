/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { DESTINATIONS } from './data/destinations';
import { INITIAL_REVIEWS, INITIAL_STORIES } from './data/community';
import {
  Destination,
  DestinationReview,
  PageRoute,
  SavedPlanRecord,
  TravelStory,
} from './types/travel';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from './lib/firebase';
import { EarthLoader } from './components/EarthLoader';
import { GoogleMapsAppProvider } from './components/MapsWrapper';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './components/HomePage';
import { ExploreWorldPage } from './components/ExploreWorldPage';
import { SmartSearchDirectory } from './components/SmartSearchDirectory';
import { DestinationGuidePage } from './components/DestinationGuidePage';
import { AdventurePlannerPage } from './components/AdventurePlannerPage';
import { TravelStoriesPage } from './components/TravelStoriesPage';
import { AboutPage, ContactPage, Footer } from './components/AboutAndContactPages';

const STORAGE_KEYS = {
  guestWishlist: 'wildearth_wishlist_v1',
  likedSeedStories: 'wildearth_liked_seeds_v1',
};

const SEEDED_STORY_IDS = new Set(INITIAL_STORIES.map((s) => s.id));

function formatTimestampLabel(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return 'Just now';
}

export default function App() {
  const [showLoader, setShowLoader] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [selectedDestination, setSelectedDestination] = useState<Destination>(DESTINATIONS[0]);
  const [plannerSeedDestId, setPlannerSeedDestId] = useState<string>(DESTINATIONS[0].id);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  // Firebase Auth & Account state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authTick, setAuthTick] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [homeBase, setHomeBase] = useState('');

  // Guest fallback wishlist & seeded story likes
  const [guestWishlistIds, setGuestWishlistIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.guestWishlist);
      return raw ? (JSON.parse(raw) as string[]) : ['fitz-roy-patagonia', 'moraine-lake-banff'];
    } catch {
      return ['fitz-roy-patagonia', 'moraine-lake-banff'];
    }
  });

  const [likedStoryIds, setLikedStoryIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.likedSeedStories);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [seededLikeBoost, setSeededLikeBoost] = useState<Record<string, number>>({});

  // Cloud Firestore live collections
  const [cloudWishlistIds, setCloudWishlistIds] = useState<string[] | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlanRecord[]>([]);
  const [cloudStories, setCloudStories] = useState<TravelStory[]>([]);
  const [cloudReviews, setCloudReviews] = useState<DestinationReview[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.guestWishlist, JSON.stringify(guestWishlistIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [guestWishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.likedSeedStories, JSON.stringify(likedStoryIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [likedStoryIds]);

  // Verify Firestore connectivity on boot
  useEffect(() => {
    void testFirestoreConnection();
  }, []);

  // Listen for Google Maps Demo Key quota or auth failure events
  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  // Public community stories & reviews listeners
  useEffect(() => {
    const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsubStories = onSnapshot(
      storiesQuery,
      (snap) => {
        const items: TravelStory[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || ''),
            author: String(data.authorName || 'Explorer'),
            authorUid: typeof data.authorUid === 'string' ? data.authorUid : undefined,
            authorRole: String(data.authorRole || 'Field Explorer'),
            destinationId: String(data.destinationId || DESTINATIONS[0].id),
            destinationName: String(data.destinationName || ''),
            country: String(data.country || ''),
            date: formatTimestampLabel(data.createdAt),
            rating: Number(data.rating || 5),
            likes: Number(data.likesCount || 0),
            imageUrl: String(data.imageUrl || DESTINATIONS[0].heroImage),
            excerpt: String(data.excerpt || ''),
            body: String(data.body || ''),
            sharedItinerarySummary:
              typeof data.sharedItinerarySummary === 'string' ? data.sharedItinerarySummary : undefined,
          };
        });
        setCloudStories(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'stories');
      }
    );

    const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubReviews = onSnapshot(
      reviewsQuery,
      (snap) => {
        const items: DestinationReview[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            destinationId: String(data.destinationId || DESTINATIONS[0].id),
            author: String(data.authorName || 'Explorer'),
            authorUid: typeof data.authorUid === 'string' ? data.authorUid : undefined,
            location: String(data.location || 'Explorer'),
            date: formatTimestampLabel(data.createdAt),
            rating: Number(data.rating || 5),
            comment: String(data.comment || ''),
          };
        });
        setCloudReviews(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'reviews');
      }
    );

    return () => {
      unsubStories();
      unsubReviews();
    };
  }, []);

  // Auth listener & per-user Firestore provisioning + listeners
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUser || !currentUser.emailVerified) {
      setCloudWishlistIds(null);
      setSavedPlans([]);
      setHomeBase('');
      return;
    }

    const uid = currentUser.uid;
    let active = true;

    const bootstrapProfile = async () => {
      const profileRef = doc(db, 'users', uid);
      try {
        const snap = await getDoc(profileRef);
        if (!active) return;
        if (!snap.exists()) {
          await setDoc(profileRef, {
            uid,
            displayName: (currentUser.displayName || 'Field Explorer').slice(0, 80),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const data = snap.data();
          if (typeof data.homeBase === 'string') {
            setHomeBase(data.homeBase);
          }
        }

        const privateRef = doc(db, 'users', uid, 'private', 'account');
        const privSnap = await getDoc(privateRef);
        if (!active) return;
        if (!privSnap.exists() && currentUser.email) {
          await setDoc(privateRef, {
            uid,
            email: currentUser.email.slice(0, 160),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error('Profile sync check failed:', err);
      }
    };

    void bootstrapProfile();

    const wishlistRef = collection(db, 'users', uid, 'wishlist');
    const unsubWishlist = onSnapshot(
      wishlistRef,
      (snap) => {
        setCloudWishlistIds(snap.docs.map((d) => d.id));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${uid}/wishlist`);
      }
    );

    const plansQuery = query(collection(db, 'users', uid, 'plans'), orderBy('createdAt', 'desc'));
    const unsubPlans = onSnapshot(
      plansQuery,
      (snap) => {
        const list: SavedPlanRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: String(data.uid || uid),
            destinationId: String(data.destinationId || DESTINATIONS[0].id),
            destinationName: String(data.destinationName || ''),
            startDate: String(data.startDate || ''),
            endDate: String(data.endDate || ''),
            budgetTier: (data.budgetTier as SavedPlanRecord['budgetTier']) || 'Mid-Range',
            partyType: (data.partyType as SavedPlanRecord['partyType']) || 'Couple',
            activities: Array.isArray(data.activities) ? data.activities.map(String) : [],
            estimatedTotalUsd: Number(data.estimatedTotalUsd || 0),
            createdAt: formatTimestampLabel(data.createdAt),
          };
        });
        setSavedPlans(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${uid}/plans`);
      }
    );

    return () => {
      active = false;
      unsubWishlist();
      unsubPlans();
    };
  }, [currentUser, currentUser?.emailVerified, authTick]);

  const handleRefreshUser = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setCurrentUser(auth.currentUser);
    setAuthTick((t) => t + 1);
  }, []);

  const activeWishlistIds =
    currentUser?.emailVerified && cloudWishlistIds !== null ? cloudWishlistIds : guestWishlistIds;

  const mergedStories = useMemo(() => {
    const adjustedSeeds = INITIAL_STORIES.map((s) => ({
      ...s,
      likes: s.likes + (seededLikeBoost[s.id] || 0),
    }));
    return [...cloudStories, ...adjustedSeeds];
  }, [cloudStories, seededLikeBoost]);

  const mergedReviews = useMemo(() => {
    return [...cloudReviews, ...INITIAL_REVIEWS];
  }, [cloudReviews]);

  const navigateTo = (page: PageRoute) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDestinationDetails = (dest: Destination) => {
    setSelectedDestination(dest);
    navigateTo('destination-details');
  };

  const openPlannerForDestination = (dest: Destination) => {
    setPlannerSeedDestId(dest.id);
    navigateTo('planner');
  };

  const toggleWishlist = async (destId: string) => {
    if (currentUser && currentUser.emailVerified) {
      const uid = currentUser.uid;
      const itemRef = doc(db, 'users', uid, 'wishlist', destId);
      const isCurrentlySaved = (cloudWishlistIds || []).includes(destId);
      if (isCurrentlySaved) {
        try {
          await deleteDoc(itemRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${uid}/wishlist/${destId}`);
        }
      } else {
        const dest = DESTINATIONS.find((d) => d.id === destId);
        try {
          await setDoc(itemRef, {
            uid,
            destinationId: destId,
            destinationName: (dest?.name || destId).slice(0, 120),
            savedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}/wishlist/${destId}`);
        }
      }
      return;
    }

    setGuestWishlistIds((prev) =>
      prev.includes(destId) ? prev.filter((item) => item !== destId) : [...prev, destId]
    );
  };

  const handleSaveHomeBase = async (newHomeBase: string) => {
    if (!currentUser || !currentUser.emailVerified) {
      setAuthModalOpen(true);
      return;
    }
    const uid = currentUser.uid;
    try {
      await updateDoc(doc(db, 'users', uid), {
        homeBase: newHomeBase.slice(0, 80),
        updatedAt: serverTimestamp(),
      });
      setHomeBase(newHomeBase.slice(0, 80));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleSavePlan = async (plan: Omit<SavedPlanRecord, 'id' | 'uid' | 'createdAt'>) => {
    if (!currentUser || !currentUser.emailVerified) {
      setAuthModalOpen(true);
      return;
    }
    const uid = currentUser.uid;
    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await setDoc(doc(db, 'users', uid, 'plans', planId), {
        id: planId,
        uid,
        destinationId: plan.destinationId,
        destinationName: plan.destinationName.slice(0, 120),
        startDate: plan.startDate,
        endDate: plan.endDate,
        budgetTier: plan.budgetTier,
        partyType: plan.partyType,
        activities: plan.activities.slice(0, 12),
        estimatedTotalUsd: plan.estimatedTotalUsd,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/plans/${planId}`);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!currentUser || !currentUser.emailVerified) return;
    const uid = currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid, 'plans', planId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/plans/${planId}`);
    }
  };

  const handleAddReview = async (review: Omit<DestinationReview, 'id' | 'date'>) => {
    if (!currentUser || !currentUser.emailVerified) {
      setAuthModalOpen(true);
      return;
    }
    const uid = currentUser.uid;
    const reviewId = `fs_rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await setDoc(doc(db, 'reviews', reviewId), {
        id: reviewId,
        authorUid: uid,
        authorName: review.author.slice(0, 80),
        location: review.location.slice(0, 80),
        destinationId: review.destinationId,
        rating: review.rating,
        comment: review.comment.slice(0, 1200),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reviews/${reviewId}`);
    }
  };

  const handleAddStory = async (story: Omit<TravelStory, 'id' | 'date' | 'likes'>) => {
    if (!currentUser || !currentUser.emailVerified) {
      setAuthModalOpen(true);
      return;
    }
    const uid = currentUser.uid;
    const storyId = `fs_story_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const docData: Record<string, unknown> = {
      id: storyId,
      authorUid: uid,
      authorName: story.author.slice(0, 80),
      authorRole: story.authorRole.slice(0, 60),
      destinationId: story.destinationId,
      destinationName: story.destinationName.slice(0, 120),
      country: story.country.slice(0, 80),
      title: story.title.slice(0, 160),
      excerpt: story.excerpt.slice(0, 240),
      body: story.body.slice(0, 6000),
      imageUrl: story.imageUrl.slice(0, 350000),
      rating: story.rating,
      likesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (story.sharedItinerarySummary && story.sharedItinerarySummary.trim()) {
      docData.sharedItinerarySummary = story.sharedItinerarySummary.trim().slice(0, 220);
    }

    try {
      await setDoc(doc(db, 'stories', storyId), docData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `stories/${storyId}`);
    }
  };

  const handleLikeStory = async (storyId: string) => {
    if (SEEDED_STORY_IDS.has(storyId)) {
      if (likedStoryIds.includes(storyId)) return;
      setLikedStoryIds((prev) => [...prev, storyId]);
      setSeededLikeBoost((prev) => ({ ...prev, [storyId]: (prev[storyId] || 0) + 1 }));
      return;
    }

    if (!currentUser || !currentUser.emailVerified) {
      setAuthModalOpen(true);
      return;
    }
    const uid = currentUser.uid;
    const likeRef = doc(db, 'stories', storyId, 'likes', uid);
    const storyRef = doc(db, 'stories', storyId);

    try {
      const existingLike = await getDoc(likeRef);
      if (existingLike.exists()) return;

      const batch = writeBatch(db);
      batch.set(likeRef, {
        uid,
        storyId,
        createdAt: serverTimestamp(),
      });
      batch.update(storyRef, {
        likesCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setLikedStoryIds((prev) => (prev.includes(storyId) ? prev : [...prev, storyId]));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `stories/${storyId}/likes/${uid}`);
    }
  };

  const handleShareItineraryToCommunity = async (payload: {
    destination: Destination;
    title: string;
    summary: string;
    body: string;
  }) => {
    await handleAddStory({
      title: payload.title,
      author: currentUser?.displayName || 'Community Explorer',
      authorRole: 'Expedition Planner',
      destinationId: payload.destination.id,
      destinationName: payload.destination.name,
      country: payload.destination.country,
      rating: 5,
      imageUrl: payload.destination.heroImage,
      excerpt: `Custom shared expedition plan: ${payload.summary}`,
      body: payload.body,
      sharedItinerarySummary: payload.summary,
    });
  };

  return (
    <GoogleMapsAppProvider>
      <div className="min-h-screen flex flex-col bg-[#0B0F0D]">
        {mapsQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {showLoader && <EarthLoader onComplete={() => setShowLoader(false)} />}

        <Navbar
          currentPage={currentPage}
          onNavigate={navigateTo}
          wishlistCount={activeWishlistIds.length}
          currentUser={currentUser}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        user={currentUser}
        homeBase={homeBase}
        wishlistCount={activeWishlistIds.length}
        savedPlansCount={savedPlans.length}
        onSaveHomeBase={handleSaveHomeBase}
        onRefreshUser={handleRefreshUser}
        onNavigateToPlanner={() => navigateTo('planner')}
      />

      <div className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            destinations={DESTINATIONS}
            selectedDestination={selectedDestination}
            onSelectDestination={setSelectedDestination}
            onOpenDetails={openDestinationDetails}
            wishlistIds={activeWishlistIds}
            onToggleWishlist={toggleWishlist}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'explore' && (
          <ExploreWorldPage
            destinations={DESTINATIONS}
            selectedDestination={selectedDestination}
            onSelectDestination={setSelectedDestination}
            onOpenDetails={openDestinationDetails}
            wishlistIds={activeWishlistIds}
            onToggleWishlist={toggleWishlist}
          />
        )}

        {currentPage === 'mountains' && (
          <SmartSearchDirectory
            title="Mountains, Ridges & Polar Glaciers"
            subtitle="High-altitude granite spires, Himalayan passes, Alpine ridges, and calving tidewater ice fields across the Earth’s great ranges."
            destinations={DESTINATIONS}
            lockedCategories={['Mountains', 'Glaciers', 'Hiking Trails']}
            wishlistIds={activeWishlistIds}
            onToggleWishlist={toggleWishlist}
            onOpenDetails={openDestinationDetails}
          />
        )}

        {currentPage === 'rivers-waterfalls' && (
          <SmartSearchDirectory
            title="Wild Rivers & Monumental Waterfalls"
            subtitle="From serpentine Amazonian oxbows and inland desert deltas to hexagonal basalt cascades and thunderous limestone gorges."
            destinations={DESTINATIONS}
            lockedCategories={['Rivers', 'Waterfalls']}
            wishlistIds={activeWishlistIds}
            onToggleWishlist={toggleWishlist}
            onOpenDetails={openDestinationDetails}
          />
        )}

        {currentPage === 'lakes-forests' && (
          <SmartSearchDirectory
            title="Glacial Lakes, Valleys & Ancient Forests"
            subtitle="Turquoise meltwater basins, old-growth coastal redwood cathedrals, and dramatic glacially sculpted valleys."
            destinations={DESTINATIONS}
            lockedCategories={['Lakes', 'Forests', 'Valleys']}
            wishlistIds={activeWishlistIds}
            onToggleWishlist={toggleWishlist}
            onOpenDetails={openDestinationDetails}
          />
        )}

        {currentPage === 'destinations' && (
          <SmartSearchDirectory
            title="All Global Destinations"
            subtitle="Search and filter extraordinary natural wonders by continent, country, biome, budget, season, difficulty, and weather."
            destinations={DESTINATIONS}
            wishlistIds={activeWishlistIds}
            onToggleWishlist={toggleWishlist}
            onOpenDetails={openDestinationDetails}
          />
        )}

        {currentPage === 'destination-details' && (
          <DestinationGuidePage
            destination={selectedDestination}
            allDestinations={DESTINATIONS}
            reviews={mergedReviews}
            isSaved={activeWishlistIds.includes(selectedDestination.id)}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onToggleWishlist={toggleWishlist}
            onBack={() => navigateTo('destinations')}
            onSelectDestination={openDestinationDetails}
            onPlanTrip={openPlannerForDestination}
            onAddReview={handleAddReview}
          />
        )}

        {currentPage === 'planner' && (
          <AdventurePlannerPage
            destinations={DESTINATIONS}
            initialDestinationId={plannerSeedDestId}
            currentUser={currentUser}
            savedPlans={savedPlans}
            onSavePlan={handleSavePlan}
            onDeletePlan={handleDeletePlan}
            onOpenAuth={() => setAuthModalOpen(true)}
            onShareItineraryToCommunity={handleShareItineraryToCommunity}
            onOpenDetails={openDestinationDetails}
          />
        )}

        {currentPage === 'stories' && (
          <TravelStoriesPage
            stories={mergedStories}
            reviews={mergedReviews}
            destinations={DESTINATIONS}
            wishlistIds={activeWishlistIds}
            likedStoryIds={likedStoryIds}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onToggleWishlist={toggleWishlist}
            onLikeStory={handleLikeStory}
            onAddStory={handleAddStory}
            onOpenDetails={openDestinationDetails}
          />
        )}

        {currentPage === 'about' && <AboutPage onNavigate={navigateTo} />}

        {currentPage === 'contact' && <ContactPage />}
      </div>

      <Footer onNavigate={navigateTo} />
      </div>
    </GoogleMapsAppProvider>
  );
}
