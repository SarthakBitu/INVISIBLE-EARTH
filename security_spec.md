# Wild Earth Firestore Security Specification

## Data Invariants
1. **Owner & Verified Auth Gate**: No user may read or modify another user's private PII (`/users/{userId}/private/*`), wishlist (`/users/{userId}/wishlist/*`), or saved plans (`/users/{userId}/plans/*`). All writes require `request.auth != null && request.auth.token.email_verified == true`.
2. **PII Isolation**: Public `/users/{userId}` documents never contain `email`, `phone`, or credentials.
3. **Immutable Ownership & Timestamps**: `uid`, `authorUid`, and `createdAt` cannot be modified after creation; `createdAt` and `updatedAt` must equal `request.time`.
4. **Strict Field Allowlisting**: Every document create enforces `hasAll` + `hasOnly` with strict type & length bounds; updates enforce `affectedKeys().hasOnly(...)`.
5. **Atomic Story Likes**: Creating `/stories/{storyId}/likes/{userId}` requires `getAfter` verification on the parent story's `likesCount` (+1) or standalone verified single-like creation when batched.

## Dirty Dozen Adversarial Payloads
1. Unauthenticated create on `/stories/s1` -> DENIED
2. Unverified email (`email_verified == false`) write on `/users/{uid}/wishlist/fitz-roy` -> DENIED
3. Cross-user read on `/users/{otherUid}/private/account` -> DENIED
4. Identity spoofing (`authorUid: "victim"`) on `/stories/s2` -> DENIED
5. Shadow field injection (`isAdmin: true`) on `/users/{uid}` -> DENIED
6. Oversized `imageUrl` (>350KB) or `body` (>6000 chars) on `/stories/s3` -> DENIED
7. Poisoned document ID (`../../admin`) on `/reviews/{id}` -> DENIED
8. Client-forged past `createdAt` timestamp on `/reviews/r1` -> DENIED
9. Updating immutable `authorUid` or `createdAt` on `/stories/s1` -> DENIED
10. Non-owner deleting another user's `/stories/s1` -> DENIED
11. Incrementing `likesCount` by +500 without a matching like subdoc -> DENIED
12. Listing `/users/{otherUid}/plans` as an unrelated user -> DENIED
