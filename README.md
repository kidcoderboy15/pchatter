# 🏓 Pickle Chatter

A React Native mobile app for the pickleball community. Find games, track stats, build your crew, and level up your pickleball experience.

## Features

- **Find Games**: Create and join pickup games with LFG (Looking For Game) posts
- **Group Management**: Create or join pickleball groups in your area
- **Match Tracking**: Log game results with detailed stats (aces, nasty nates, pegs)
- **Social Confirmation**: Players confirm match results together
- **Stats & Leaderboards**: Track personal and group performance
- **Token Economy**: Earn tokens for participation and achievements
- **Pickle Trophies**: Celebrate perfect 11-0 victories
- **Availability Sharing**: Set your schedule so friends know when you can play
- **Peer Ratings**: Rate fellow players on skill and sportsmanship
- **ATP Rankings**: Community-driven skill ratings

## Tech Stack

- **Frontend**: React Native + Expo + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time + Storage)
- **State Management**: React Context + Hooks
- **Navigation**: React Navigation
- **UI**: React Native + Expo components with custom design system
- **Build**: EAS Build

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- iOS Simulator (Mac) or Android Emulator
- Supabase account

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/pickle-chatter.git
cd pickle-chatter
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run migrations in order:

```bash
# Navigate to your Supabase project SQL editor and run each migration file
# in numerical order (001, 002, 003, etc.)
cat supabase/migrations/*.sql
```

### 5. Run the app

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
pickle-chatter/
├── src/
│   ├── components/        # Reusable UI components
│   ├── constants/         # Theme, colors, sizes
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # App screens
│   ├── services/          # Business logic (rewards, etc.)
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions (validation, etc.)
├── supabase/
│   └── migrations/        # Database migrations
├── assets/                # Images, fonts, icons
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
└── package.json

```

## Database Migrations

Migrations are numbered sequentially and should be run in order:

- `001_initial_schema.sql` - Core tables and RLS
- `002_atp_rankings.sql` - ATP ranking system
- `003_group_stats.sql` - Group leaderboards
- `004_token_economy.sql` - Token rewards system
- `005_friendships.sql` - Friend system
- `006_feed.sql` - Activity feed
- `007_consensus_levels.sql` - Peer rating tiers
- `008_nasty_nates_and_pegs.sql` - New game stats
- `009_comprehensive_rls_policies.sql` - Complete security policies
- `010_token_deduplication_and_security.sql` - Token security fixes
- `011_performance_indexes.sql` - Performance optimizations

## Key Features Explained

### Game Stats

- **Aces**: Serves that win the point directly
- **Nasty Nates**: Exceptional plays (killer dinks, ATP shots, etc.)
- **Pegs**: Times you got hit by the ball

### Token Economy

- Earn tokens for playing, winning, and achieving milestones
- Daily cap of 300 tokens prevents spam
- Deduplication prevents double-rewards

### Pickle Trophies

- Awarded for winning 11-0 (shutout victories)
- Tracked on profile and group leaderboards

### Social Confirmation

- Match results require confirmation from other players
- Prevents stat padding and ensures accuracy
- Builds trust in the community

## Building for Production

### iOS

```bash
# Configure EAS (first time only)
eas build:configure

# Create production build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

### Android

```bash
# Create production build
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

## Environment Variables

Required environment variables:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SENTRY_DSN` (optional) - Sentry crash reporting DSN

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Support

For support, email support@picklechatter.com or join our Discord community.

## Acknowledgments

- Built with [Expo](https://expo.dev)
- Backend powered by [Supabase](https://supabase.com)
- Icon design by [Your Designer]
- Inspired by the amazing pickleball community
