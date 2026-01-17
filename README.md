# Pickle Chatter 🥒

**The pickleball social OS that makes PlayTime Scheduler look like a calendar app.**

## What This Is

Pickle Chatter turns your friend group into a high-octane pickleball machine. While PlayTime Scheduler is out here asking people to manually coordinate times like it's 2015, we're auto-matching players, logging 11-0 shutouts, and turning trash talk into a competitive sport.

### The 10-Second Game Loop (Why This Wins)

```
1. Open app → See "3 games near you NOW" (instant, no scrolling)
2. Tap "JOIN" → Auto-matched by skill + location
3. Game fills → Push notification: "GAME ON 🎾"
4. Play pickleball → Have fun
5. Tap score (11-7) → Submit in 10 seconds
6. Feed explodes → "Alex got PICKLED 11-0 🥒"
7. Earn 60 tokens → Redeem for merch
8. Repeat
```

**PlayTime makes you:**
- Post a session manually
- Wait for RSVPs
- Text people to confirm
- Hope someone shows up
- Log nothing
- Get nothing

**Pickle Chatter does this:**
- Auto-matches you with compatible players
- Fills games instantly
- Sends push notifications
- Creates verified results
- Awards pickle trophies
- Feeds group trash talk
- Gives you tokens for merch

## The Wedge Strategy

PlayTime has 488,000 users. We're not beating them head-on.

**Our wedge:** Private groups + instant matching + post-game culture

### What PlayTime Does Well
- Calendar scheduling
- Big user base
- Session RSVPs

### What Pickle Chatter Does Better
1. **Instant Matching** - Algorithm scores compatibility (skill ±1, distance, format) and surfaces best matches
2. **10-Second Results** - Quick-tap scores (11-0, 11-9, etc.) with pickle trophy detection
3. **Social Feedback Loop** - Every game generates feed posts, trophies, tokens, status
4. **Private Group Gravity** - Everything happens in your crew, not a public calendar
5. **Gamification That Works** - Tokens tied to verified gameplay, not fake engagement

## Tech Stack

- **Frontend:** React Native + Expo (iOS, Android, Web)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Language:** TypeScript
- **Navigation:** React Navigation (nested stacks)
- **State:** React hooks + Supabase real-time subscriptions

## Core Features (Actually Built)

### ✅ Authentication & Onboarding
- Email/phone OTP via Supabase
- Username, skill level (1-6), location, availability setup
- Join/create groups during onboarding

### ✅ Groups (Private/Public)
- Private groups with join codes + password (bcrypt hashed)
- Public geo-based groups
- Role-based access (admin, mod, member)
- Group feed with activity

### ✅ LFG Board (THE KILLER FEATURE)
- Browse open games with filters (Now, Today, This Week)
- **Compatibility scoring** - Shows "85% Match" based on:
  - Skill level (±1 tolerance)
  - Distance (0-10 miles optimized)
  - Format preference (doubles/singles/either)
- One-tap JOIN button
- Auto-creates session when full
- Real-time updates via Supabase subscriptions

### ✅ Matching Algorithm
```typescript
// Scoring formula (0-1 scale):
score = (0.4 × skillMatch) + (0.2 × formatMatch) + (0.4 × distanceMatch)

// Skill match: Perfect if within range, penalty if outside
// Format match: Perfect if either is "either" or exact match
// Distance: Perfect ≤2mi, good ≤5mi, OK ≤10mi, decay after
```

### ✅ Session Management
- Auto-created from filled LFG posts
- Participant roster with team assignments
- Check-in functionality
- Push to group feed when created

### ✅ Result Logging (10-Second Flow)
- Quick-score buttons (11-0 🥒, 11-9, 11-7, 11-5)
- Pickle trophy detection (11-0 shutout)
- Confirmation system (needs 2+ confirmations per team)
- Auto-awards tokens
- Auto-posts to group feed

### ✅ Pickle Trophy System
- Detects 11-0 shutouts
- Awards 50 bonus tokens
- Increments pickle_trophy_count on user profile
- Epic feed post: "🥒 PICKLE ALERT! Someone got pickled!"

### ✅ Tokens & Rewards
```
Match result:       +10 tokens
Quick confirm:      +5 tokens (within 1 hour)
Pickle trophy:      +50 tokens
Weekly streak:      +20 tokens (3+ games/week)
Friend invite:      +15 tokens (when they play first game)

Daily cap: 200 tokens (prevents abuse)
```

### ✅ Peer Ratings & Consensus
- Rate opponents 1-6 after each match
- Consensus level = median of last 20 ratings
- Confidence score based on rating count
- Used by matching algorithm for better pairings

### ✅ Friend System
- QR code per user (shareable deep link)
- Scan to add friends
- Block/avoid lists (private, affects matching)

### ✅ Group Feed
- Auto-posts for:
  - Session created
  - Match result posted
  - Pickle trophy earned
  - Win streaks
- Manual posts (text, GIFs, trash talk)
- Mute/report controls

## Database Schema

**17 tables, fully normalized:**

```
users → friendships, group_members, sessions, ratings, tokens
groups → group_members, lfg_posts, sessions, feed_posts
lfg_posts → lfg_time_options, lfg_claims → sessions
sessions → session_participants, match_results, peer_ratings
match_results → result_confirmations, feed_posts
token_ledger → token_balances (computed)
peer_ratings → consensus_levels (computed via function)
```

**Key DB Functions:**
- `increment_pickle_trophies(user_id)` - Atomic trophy increment
- `calculate_consensus_level(user_id, group_id)` - Median of last 20 ratings
- `update_all_consensus_levels()` - Batch update (run periodically)

**RLS Policies:** Enabled on all tables, users can only access groups they're members of.

**Indexes:** Optimized for LFG browsing, session lookups, token queries.

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier works)

### 1. Clone & Install
```bash
git clone <repo>
cd pchatter
npm install
```

### 2. Configure Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run migrations:
```bash
# In Supabase dashboard → SQL Editor
# Run supabase/migrations/001_initial_schema.sql
# Run supabase/migrations/002_functions.sql
```

### 3. Run the App

```bash
# Start Expo dev server
npm start

# Then:
# - Scan QR with Expo Go app (iOS/Android)
# - Press 'i' for iOS simulator (Mac only)
# - Press 'a' for Android emulator
# - Press 'w' for web
```

## File Structure

```
pchatter/
├── src/
│   ├── navigation/          # Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── OnboardingNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── stacks/
│   │       ├── HomeStack.tsx
│   │       ├── GroupsStack.tsx
│   │       └── ProfileStack.tsx
│   ├── screens/             # UI screens
│   │   ├── auth/           # Login, VerifyCode
│   │   ├── onboarding/     # Username, Skill, Location, etc.
│   │   ├── main/           # Home, CreateLFG, SessionDetail, LogResult
│   │   ├── groups/         # GroupsList, LFGBoard, Feed, Members
│   │   └── profile/        # Profile, QR, Friends, Settings
│   ├── services/            # Business logic (THE BRAIN)
│   │   ├── supabase.ts     # Supabase client
│   │   ├── matchingService.ts  # Compatibility scoring, session creation
│   │   └── rewardService.ts    # Token awards, daily caps
│   └── types/
│       └── database.ts      # TypeScript types for DB schema
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # All tables + RLS
│       └── 002_functions.sql       # DB functions
├── App.tsx
├── package.json
└── README.md (you are here)
```

## The Competitive Moat

### PlayTime Scheduler (488K users)
- **Strength:** Network effect, established user base
- **Weakness:** Utility product, no culture, no status, no retention hooks

### Pickle Chatter
- **Strength:** Group-first social OS, instant matching, gamification that drives repeat usage
- **Weakness:** Zero users (yet)

### How We Win

1. **Wedge:** Start with private groups (friend circles, leagues, clubs)
2. **Retention:** Post-game culture (feed + trophies + tokens) keeps people coming back
3. **Virality:** QR codes, friend invites, group join codes
4. **Network effects:** More users → better matches → more games → more feed activity → more status → more users

### Metrics That Matter

- **Time to first game** (target: <2 minutes from signup)
- **Games per week per user** (target: 3+)
- **7-day retention** (target: 60%+)
- **Pickle trophies per 100 games** (fun metric, tracks competitive culture)

## What's Next

### Must-Have Before Beta
- [ ] Push notifications for game invites
- [ ] Location permissions handling
- [ ] Camera permissions for QR scanning
- [ ] Image upload for profile photos
- [ ] Leaderboard screen (simple: most games, most trophies, highest consensus)

### Nice-to-Have (Post-Beta)
- [ ] Waitlist + auto-fill when someone bails
- [ ] Court rotation mode (4 on / 4 off queue)
- [ ] Calendar sync (iCal export)
- [ ] Weather alerts
- [ ] Court favorites with notes
- [ ] Cost split tracking
- [ ] Clinic/coach postings
- [ ] Video highlights (10-20 sec clips)
- [ ] Advanced matchmaking (avoid repeated pairings, balanced teams)

### Infrastructure
- [ ] Analytics (Mixpanel or Amplitude)
- [ ] Error tracking (Sentry)
- [ ] Feature flags (LaunchDarkly or simple config)
- [ ] EAS Build configuration for App Store / Play Store
- [ ] CI/CD pipeline

## Known Issues / TODOs

1. **Onboarding group join** - Password validation not implemented (line 37-38 in onboarding/JoinGroupScreen.tsx)
2. **QR group join** - Not connected to group join flow (line 52 in profile/ScanQRScreen.tsx)
3. **Settings screens** - Menu items are stubs (notifications, blocked users)
4. **Consensus calculation** - Function exists but not called automatically (need cron job or trigger)
5. **Result confirmations UI** - Players get notified but can't confirm from push notification yet

## Contributing

This is a product, not an open-source project. If you're on the team:

1. Branch naming: `feature/your-name/short-description`
2. Commit messages: Start with type (`feat:`, `fix:`, `refactor:`, `docs:`)
3. PR template: What/Why/Testing
4. Code review required

## License

Proprietary. All rights reserved.

---

**Built with 🥒 by the Pickle Chatter team**

*Making pickleball social again.*
