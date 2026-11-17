# WILD EARTH – Explore Beyond Limits

An interactive, documentary-style nature and travel exploration web application covering all 7 continents and 10 natural biomes (`Mountains`, `Rivers`, `Waterfalls`, `Lakes`, `Forests`, `Glaciers`, `Valleys`, `Deserts`, `Islands`, and `Hiking Trails`).

---

## Implemented Features

- **Cinematic Portal Loader & Documentary Hero**: Radial `clip-path` portal opening (`EarthLoader`), multi-scene Ken Burns visual reel with atmospheric particle canvas, GSAP headline reveals, and historical seasonal climate strips.
- **PowerPoint-Style Interactive Expedition Slide Showcase**: Replaces the earlier 3D globe with JavaScript mouse-tracked perspective parallax and 4 selectable CSS/JS radical transition modes (`Radial Iris`, `Radical Push`, `3D Cube Turn`, `Curtain Wipe`). Hovering radial waypoint markers and filmstrip thumbnails triggers animated popup cards displaying verified geographic telemetry, seasonal access windows, and conservation stewardship notes.
- **16 Curated Natural Destinations & Complete Destination Guides**: Every destination includes exact WGS-84 coordinates, overview essays, fullscreen keyboard-navigable gallery lightbox, historical seasonal weather breakdown, nearest airports/railways, stays, regional cuisine, adventure activities, permit requirements, safety protocols, recommended itinerary, official verification source citation (`verificationSource`), and place/people protection guidelines (`conservationStewardship`).
- **Interactive Google Maps World Discovery & Sector Maps**: Powered by Google Maps Platform (`Maps JavaScript API` via `@vis.gl/react-google-maps`) with switchable `Hybrid Satellite`, `Terrain Relief`, `Satellite`, and `Roadmap` base layers, `<AdvancedMarker>` destination pins, `InfoWindow` previews, true geodesic `Polyline` flight arcs from departure hubs, local conservation sector perimeter circles, Haversine distance/flight-time estimators, and direct Google Maps deep links.
- **9-Dimension Smart Search Directory**: Filter across destination name, country, continent, nature category, budget tier, travel season, difficulty, popularity, and weather condition.
- **Adventure Planner**: Generates day-by-day itineraries and itemized USD budget estimates by trip dates, travel party (`Solo`, `Couple`, `Friends`, `Family`), comfort tier (`Budget`, `Mid-Range`, `Luxury`), and selected activities. Signed-in users can save, load, and delete plans in Cloud Firestore.
- **Travel Community & Field Reviews**: Visitors can inspect traveler stories and destination reviews, and verified signed-in users can publish stories with client-side JPEG photo compression, post destination reviews, share custom planner itineraries, and atomically like community dispatches.
- **Firebase Authentication & Cloud Firestore Persistence**: Supports Google Sign-In (`signInWithPopup`) and Email/Password Sign-Up/Sign-In (`createUserWithEmailAndPassword` / `signInWithEmailAndPassword` with email verification enforcement), cloud wishlist syncing, saved adventure plans, public community stories/likes, and destination reviews protected by deployed `firestore.rules`.

---

## Firebase Setup & Verification Notes

1. **Google Sign-In**: Works out of the box via Firebase Authentication (`signInWithPopup`).
2. **Email/Password Sign-In**: If you have not yet enabled Email/Password in Firebase Console, open **Firebase Console → Authentication → Sign-in method → Email/Password** and toggle it **Enabled**.
3. **Email Verification Enforced by Security Rules**: Deployed `firestore.rules` strictly requires `request.auth.token.email_verified == true` for all user writes (profile updates, wishlist bookmarks, saved expedition plans, stories, likes, and reviews). When signing up with email/password, check your inbox, click the verification link, and click **Refresh Status** in the account modal.
4. **Guest Mode Fallback**: Unauthenticated visitors can still browse all guides and bookmark destinations locally via `localStorage`.

---

## Honest Limitations & Unimplemented Features

In keeping with full transparency, the following features are **not** backed by live external APIs or transactional backends in this version:

1. **Live Real-Time Weather & Dynamic Flight/Hotel Pricing**:
   - The Hero telemetry strip, Destination Guides, and Adventure Planner display curated historical seasonal averages and baseline daily USD cost models rather than calling live meteorological or airline/hotel booking APIs.
2. **In-App Turn-by-Turn Driving Routing**:
   - The interactive Google Map calculates geodesic great-circle flight arcs and estimated travel times between departure hubs and destinations, while turn-by-turn street/trail navigation opens directly in Google Maps via external deep links rather than calling the paid Routes API in-app.
3. **Streamed Video Files in Hero & Destination Banners**:
   - To remain self-contained and reliable without external video CDNs, visual reels combine generated landscape imagery, smooth CSS Ken Burns motion, and an HTML5 canvas atmospheric particle layer rather than `.mp4`/HLS video streams.
4. **Firebase Cloud Storage Media Buckets**:
   - Community story photo uploads are compressed in-browser using an HTML5 `<canvas>` into a JPEG Data URL (`<= 350 KB`) stored inside the Firestore document rather than uploading raw multi-megabyte files to Firebase Cloud Storage.
5. **Live National Park Permit Purchases & Booking Checkout**:
   - Permit rules and fee guidance reflect official park agency structures for reference, but permits, lodges, and guides cannot be booked or paid for directly inside the app.
6. **Expedition Desk Contact Form Email Delivery**:
   - The Contact page form validates input and renders an on-screen confirmation state in the browser; it does not dispatch emails through an SMTP server or external ticketing backend.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, GSAP, Lucide Icons
- **Maps & Geospatial**: Google Maps Platform (`@vis.gl/react-google-maps`, Maps JavaScript API)
- **Backend / Cloud**: Firebase Authentication & Cloud Firestore (`firebase-applet-config.json`, `firestore.rules`)
