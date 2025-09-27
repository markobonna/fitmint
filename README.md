# FitMint - Exercise to Earn WLD

FitMint is a revolutionary health & fitness mini app for World App that incentivizes daily exercise through crypto rewards. By leveraging World ID's proof-of-personhood and Android Health Connect's real-time health data, FitMint creates a sybil-resistant exercise-to-earn ecosystem where verified humans can claim daily WLD rewards for meeting fitness goals.

## Project Overview

FitMint consists of two main components:

1. **Web Mini App**: A Next.js application that integrates with World App to verify users, track their progress, and distribute WLD rewards.

2. **Android Companion App**: A React Native application that connects to Android Health Connect to collect health data (steps, exercise, calories, etc.) and synchronizes it with the web mini app.

## Tech Stack

- **Web Mini App**
  - Next.js 15 with TypeScript
  - MiniKit SDK for World App integration
  - Tailwind CSS for styling
  - API Routes for backend functionality

- **Android Companion App**
  - React Native 0.75+ with TypeScript
  - React Native Health Connect for fitness data
  - AsyncStorage for local data persistence
  - NativeWind for styling

- **Backend/Infrastructure**
  - pnpm (package manager)
  - PostgreSQL (database - planned)
  - Vercel (hosting - planned)

## Project Structure

```
FitMint/
├── packages/
│   ├── web/              # Next.js Mini App for World App
│   │   ├── app/          # App router components and API routes
│   │   └── public/       # Static assets
│   │
│   ├── mobile/           # React Native Android Companion App
│   │   └── FitMintCompanion/  # Main mobile app
│   │
│   └── shared/           # Shared code/types (future use)
│
├── FitMint-Implementation-Checklist.md  # Implementation status
├── FitMint-Implementation-Plan.md       # Step-by-step action plan
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- Android Studio (for mobile development)
- Next.js knowledge
- React Native knowledge

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fitmint.git
   cd fitmint
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env.local in packages/web
   cp packages/web/.env.example packages/web/.env.local
   # Edit the file with your specific values
   ```

### Running the Web Mini App

```bash
# From project root
pnpm dev:web

# Or from web package
cd packages/web
pnpm dev
```

This starts the Next.js development server at http://localhost:3000.

### Running the Android Companion App

```bash
# From project root
pnpm dev:mobile

# Or from mobile package
cd packages/mobile/FitMintCompanion
pnpm android
```

Make sure you have an Android emulator running or a physical device connected.

## Development Roadmap

### Phase 1: MVP (Current)
- [x] World ID verification integration
- [x] Android Health Connect data retrieval (steps, exercise)
- [x] Daily step goal tracking (10,000 steps)
- [x] WLD reward claiming (1 WLD/day)
- [x] Progress visualization with Tailwind
- [x] Deep linking to World App

### Phase 2: Growth (Planned)
- [ ] Exercise variety (running, cycling, gym sessions)
- [ ] Streak system with bonus multipliers
- [ ] Leaderboards (global, friends, regional)
- [ ] Push notifications for reminders
- [ ] USDC stablecoin option

### Phase 3: Scale (Future)
- [ ] Social challenges & tournaments
- [ ] NFT achievement badges on World Chain
- [ ] Partner integrations (gyms, wearables)
- [ ] Premium subscription tier
- [ ] Health insights dashboard

## Documentation

- See `FitMint-Implementation-Checklist.md` for current implementation status
- See `FitMint-Implementation-Plan.md` for detailed next steps
- Additional documentation will be added as the project develops

## Testing

### Local Testing
1. Run `pnpm dev:web` to start the Next.js server
2. Open browser to http://localhost:3000
3. Click "Verify with World ID" to simulate verification
4. Health data will auto-update with mock values
5. Once goals are met, claim button becomes active

### World App Testing
1. Use ngrok to expose local server: `ngrok http 3000`
2. Add ngrok URL to World Developer Portal
3. Scan QR code from portal with World App
4. Test full flow with real World ID verification

### Android App Testing
1. Install Google Health Connect on device/emulator
2. Run `pnpm android` in mobile package
3. Grant health permissions
4. Walk around or add manual data to Health Connect
5. See real-time sync in companion app

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

[MIT License](LICENSE)

## Acknowledgements

- Built for the World Build 2.0 Hackathon
- Thanks to the Worldcoin team for the World App platform
- Fitness data integration through Android Health Connect
