# FitMint: Exercise to Earn WLD - WorldCoin Mini App Submission

## Overview

FitMint is a health & fitness mini app for World App that incentivizes daily exercise through WLD rewards. Using World ID's proof-of-personhood and Android Health Connect's real-time health data, FitMint creates a sybil-resistant exercise-to-earn ecosystem where verified humans can claim daily WLD rewards for meeting fitness goals.

## Technical Details

### Components

1. **Web Mini App**: A Next.js application that integrates with World App to verify users, track their progress, and distribute WLD rewards.
2. **Android Companion App**: A React Native application that connects to Android Health Connect to collect health data (steps, exercise, calories, etc.) and synchronizes it with the web mini app.

### Tech Stack

- **Web Mini App**
  - Next.js 15 with TypeScript
  - MiniKit SDK for World App integration
  - Tailwind CSS for styling
  - API Routes for backend functionality

- **Android Companion App**
  - React Native with TypeScript
  - React Native Health Connect for fitness data
  - AsyncStorage for local data persistence
  - NativeWind for styling

### WorldCoin Integration

FitMint utilizes the following World App features:

1. **World ID Verification**: To ensure one human per account and prevent sybil attacks
2. **WLD Payments**: To reward users for completing daily fitness goals
3. **Social Sharing**: To share achievements and promote the app

## User Flow

### Mini App Screens & Interactions

1. **Main Screen**
   - Progress indicators for steps and exercise minutes
   - Daily goals display (10,000 steps or 30 minutes exercise)
   - Claim button for daily rewards (1 WLD)
   - Stats overview (rank, streak, total earned)
   - Share button to share achievements

2. **Verification Screen**
   - World ID verification prompt for new users
   - Information about the verification process

3. **Demo Mode**
   - Demo user selection for trying different scenarios
   - Mock data for demonstration purposes

### Companion App Screens & Interactions

1. **Connection Status Screen**
   - Health Connect status and permissions
   - Data synchronization status

2. **Activity Tracking Screen**
   - Current day's fitness metrics
   - Synchronization controls
   - Link to open World App mini app

3. **Demo Mode**
   - Simulated health data for testing
   - Different user profiles for demonstration

## World App Mini App Integration

### Required Permissions

- `verify`: For World ID verification
- `pay`: For WLD rewards
- `share`: For sharing achievements

### Mini App ID

- `fitmint`

### Category

- Health & Fitness

## Deployment

The FitMint mini app is deployed on Vercel with the following configuration:

```json
{
  "buildCommand": "cd packages/web && pnpm build",
  "outputDirectory": "packages/web/.next",
  "framework": "nextjs",
  "rewrites": [
    { 
      "source": "/(.*)", 
      "destination": "/packages/web/$1" 
    }
  ]
}
```

## Demo Information

For demo purposes, FitMint includes mock user profiles with different scenarios:

1. **New User** - Just installed the app, not yet verified
2. **Verified User** - Regular user who has claimed rewards before
3. **Fitness Enthusiast** - Dedicated user with a long streak
4. **Already Claimed** - User who already claimed their reward today

These demo profiles allow WorldCoin reviewers to test all app functionality without needing real fitness data.

## Further Development

Future plans for FitMint include:

- Exercise variety (running, cycling, gym sessions)
- Streak system with bonus multipliers
- Leaderboards (global, friends, regional)
- NFT achievement badges on World Chain
- Premium subscription tier

## Contact Information

- **Developer**: Mark Obonna
- **GitHub**: https://github.com/markobonna/fitmint
