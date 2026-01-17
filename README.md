# Pickle Chatter

A social scheduling and lightweight league app for pickleball players.

## What is Pickle Chatter?

Pickle Chatter turns messy group texts into an organized platform where you can:
- See who is actively looking for a game (right now, or later)
- Match by geography, time, and skill level
- Track results, talk trash, and earn "pickle" trophies for 11-0 shutouts
- Run private groups with codes/passwords, plus public geo groups

## Features

### MVP Features Implemented

1. **Authentication**
   - Phone/email OTP login
   - Secure session management

2. **User Profiles**
   - Username and display name
   - Self-rated skill level (1-6)
   - Pickle trophy count
   - QR code for easy friend adding
   - Show rate and reliability stats

3. **Friend System**
   - QR code scanning to add friends
   - Friend requests
   - Block and avoid lists

4. **Groups**
   - Private groups with join codes and passwords
   - Public geo-based groups
   - Group roles (admin, mod, member)
   - Group feed and activity

5. **LFG (Looking For Game) Board**
   - Create posts with multiple time options
   - Specify format (doubles/singles)
   - Location-based matching
   - Skill range filtering
   - Real-time availability

6. **Sessions**
   - Auto-created from filled LFG posts
   - Check-in functionality
   - Session chat
   - Match result logging

7. **Match Results**
   - Score entry and confirmation
   - Pickle trophy detection (11-0 shutouts)
   - Verified results system
   - Post-game rating

8. **Ratings System**
   - Self level (1-6)
   - Peer ratings after matches
   - Consensus level calculation
   - Confidence scoring

9. **Tokens & Rewards**
   - Earn tokens for verified matches
   - Weekly streaks
   - Activity bonuses
   - Token balance tracking

10. **Group Feed**
    - Auto-posts for achievements
    - Pickle trophy announcements
    - Win streaks
    - Custom posts

## Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Navigation**: React Navigation
- **QR Codes**: react-native-qrcode-svg + expo-barcode-scanner
- **Location**: expo-location

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pchatter
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to Project Settings > API
3. Copy your project URL and anon key

### 3. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database

Run the migration in your Supabase SQL editor:

```bash
# Copy the contents of supabase/migrations/001_initial_schema.sql
# Paste and run in Supabase SQL Editor
```

This will create all necessary tables, indexes, and RLS policies.

### 5. Enable Authentication

In your Supabase dashboard:

1. Go to Authentication > Providers
2. Enable Email provider
3. (Optional) Enable Phone provider and configure Twilio

### 6. Run the App

```bash
# Start Expo dev server
npm start

# Or run on specific platform
npm run ios     # iOS
npm run android # Android
npm run web     # Web
```

## Project Structure

```
pchatter/
├── src/
│   ├── components/       # Reusable components
│   ├── navigation/       # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── OnboardingNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── stacks/
│   ├── screens/          # Screen components
│   │   ├── auth/         # Login, verify code
│   │   ├── onboarding/   # Username, skill, location, etc.
│   │   ├── main/         # Home, create LFG, sessions
│   │   ├── groups/       # Groups list, create, join
│   │   └── profile/      # Profile, QR, friends, settings
│   ├── services/         # API services
│   │   └── supabase.ts   # Supabase client
│   ├── types/            # TypeScript types
│   │   └── database.ts   # Database type definitions
│   └── utils/            # Utility functions
├── supabase/
│   └── migrations/       # Database migrations
├── App.tsx               # Root component
└── package.json
```

## Database Schema

The app uses Supabase (PostgreSQL) with the following main tables:

- `users` - User profiles and settings
- `friendships` - Friend connections
- `groups` - Private and public groups
- `group_members` - Group membership
- `availability_blocks` - Recurring availability
- `lfg_posts` - Looking for game posts
- `lfg_time_options` - Time options for LFG posts
- `lfg_claims` - User claims on LFG posts
- `sessions` - Scheduled game sessions
- `session_participants` - Session players
- `match_results` - Game results
- `result_confirmations` - Result verification
- `peer_ratings` - Post-game ratings
- `consensus_levels` - Calculated skill levels
- `avoid_list` - User avoidance preferences
- `token_ledger` - Token transactions
- `token_balances` - Current token balances
- `feed_posts` - Group feed posts

## Key Concepts

### Skill Levels (1-6)

- **1 - Beginner**: Just learning the basics
- **2 - Novice**: Know the rules, learning strategy
- **3 - Intermediate**: Solid fundamentals
- **4 - Advanced**: Competitive player
- **5 - Expert**: Tournament level
- **6 - Pro**: Professional/elite

### Pickle Trophy

When a match ends 11-0, the winner earns a "Pickle Trophy" - a badge of dominance and a source of friendly trash talk.

### Consensus Level

Your skill level as rated by peers after verified matches. Uses median of last 20 ratings to prevent trolling.

### Tokens

Earn tokens by:
- Playing verified matches (+10)
- Confirming results quickly (+5)
- Weekly activity streak (+20)
- Hosting filled sessions (+5)

## Development Roadmap

### Completed (MVP)
- ✅ Authentication
- ✅ User profiles
- ✅ Groups
- ✅ LFG board
- ✅ Sessions
- ✅ Match results
- ✅ Ratings
- ✅ Tokens
- ✅ QR codes
- ✅ Group feed

### Future Enhancements
- [ ] Waitlist and auto-fill
- [ ] Court rotation mode
- [ ] Calendar sync
- [ ] Weather alerts
- [ ] Court favorites with notes
- [ ] Cost splitting
- [ ] Clinic and coach postings
- [ ] Video highlights
- [ ] Advanced matchmaking algorithm
- [ ] Push notifications
- [ ] In-app messaging
- [ ] Leaderboards
- [ ] Achievements system
- [ ] Merch store integration

## Contributing

This is a product spec implementation. Feel free to fork and customize for your needs.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for the pickleball community**
