export type NatureCategory =
  | 'Mountains'
  | 'Rivers'
  | 'Waterfalls'
  | 'Lakes'
  | 'Forests'
  | 'Glaciers'
  | 'Valleys'
  | 'Deserts'
  | 'Islands'
  | 'Hiking Trails';

export type Continent =
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Africa'
  | 'Oceania'
  | 'Antarctica';

export type DifficultyLevel = 'Accessible' | 'Moderate' | 'Challenging' | 'Expedition';

export type BudgetTier = 'Budget' | 'Mid-Range' | 'Luxury';

export type TravelSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Year-Round';

export type WeatherCondition =
  | 'Alpine Crisp'
  | 'Tropical Mist'
  | 'Arctic Clear'
  | 'Arid Sun'
  | 'Temperate';

export type PageRoute =
  | 'home'
  | 'explore'
  | 'mountains'
  | 'rivers-waterfalls'
  | 'lakes-forests'
  | 'destinations'
  | 'destination-details'
  | 'planner'
  | 'stories'
  | 'about'
  | 'contact';

export interface SeasonalWeather {
  season: string;
  months: string;
  tempRange: string;
  summary: string;
}

export interface NearbyAttraction {
  name: string;
  distanceKm: number;
  type: NatureCategory;
  note: string;
}

export interface StayOption {
  name: string;
  style: string;
  pricePerNight: string;
  highlight: string;
}

export interface DiningOption {
  name: string;
  cuisine: string;
  specialty: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface GalleryItem {
  url: string;
  caption: string;
  credit: string;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  region: string;
  country: string;
  continent: Continent;
  category: NatureCategory;
  coordinates: {
    lat: number;
    lng: number;
    formatted: string;
  };
  shortDescription: string;
  overview: string[];
  metricLabel: string;
  metricValue: string;
  elevationMeters: number;
  bestSeason: string;
  seasonTag: TravelSeason;
  avgTemp: string;
  weatherCondition: WeatherCondition;
  difficulty: DifficultyLevel;
  budgetTier: BudgetTier;
  estimatedDailyBudgetUsd: number;
  popularityScore: number;
  heroImage: string;
  gallery: GalleryItem[];
  weatherProfile: SeasonalWeather[];
  howToReach: {
    nearestAirport: string;
    nearestRailway: string;
    distanceFromMajorCity: string;
    transportOptions: string[];
  };
  nearbyAttractions: NearbyAttraction[];
  stays: StayOption[];
  dining: DiningOption[];
  activities: string[];
  permitsAndFees: string;
  safetyGuidelines: string[];
  localCultureTips: string[];
  recommendedItinerary: ItineraryDay[];
  verificationSource: string;
  conservationStewardship: string;
}

export interface DestinationReview {
  id: string;
  destinationId: string;
  author: string;
  authorUid?: string;
  location: string;
  date: string;
  rating: number;
  comment: string;
}

export interface TravelStory {
  id: string;
  title: string;
  author: string;
  authorUid?: string;
  authorRole: string;
  destinationId: string;
  destinationName: string;
  country: string;
  date: string;
  rating: number;
  likes: number;
  imageUrl: string;
  excerpt: string;
  body: string;
  sharedItinerarySummary?: string;
}

export interface SavedPlanRecord {
  id: string;
  uid: string;
  destinationId: string;
  destinationName: string;
  startDate: string;
  endDate: string;
  budgetTier: BudgetTier;
  partyType: 'Solo' | 'Couple' | 'Friends' | 'Family';
  activities: string[];
  estimatedTotalUsd: number;
  createdAt: string;
}
