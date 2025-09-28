# FitMint App Screens and Interactions

This document provides a comprehensive overview of all screens and user interactions available in the FitMint Mini App (World App) and the FitMint Companion App (Android).

## FitMint Mini App (World App)

### Main Dashboard Screen

**Visible Elements:**
- App header with FitMint logo
- Total WLD earned display
- Current streak counter
- Demo user selection button (development only)
- Progress bars for:
  - Steps (out of 10,000 daily goal)
  - Exercise minutes (out of 30 minutes daily goal)
- Calories burned counter
- Reward claim button
- Quick action buttons:
  - Refresh data
  - Share achievements
- Stats grid:
  - User rank
  - Friends count
  - Average steps

**User Interactions:**
- View fitness progress in real-time
- Claim daily WLD rewards (if eligible)
- Refresh health data manually
- Share achievements to social networks
- Access demo mode for testing different user scenarios

**States:**
1. **Not Verified**: User must verify with World ID before claiming rewards
2. **Verified, Goal Not Met**: User is verified but hasn't met the fitness goals yet
3. **Verified, Goal Met, Not Claimed**: User is eligible to claim rewards
4. **Verified, Already Claimed**: User has already claimed today's reward
5. **Demo Mode**: Simulated user profiles with different states

### World ID Verification Screen

**Visible Elements:**
- Verification banner
- Information about verification process
- Verify with World ID button

**User Interactions:**
- Learn why verification is required
- Initiate World ID verification process
- Complete verification to unlock reward claiming

### Demo Mode Selection Modal

**Visible Elements:**
- Modal title and close button
- List of available demo users
- User name and description for each option
- Selection indicator for active user
- Clear selection button

**User Interactions:**
- Select different demo user profiles
- Test app with different user states
- Clear demo selection to return to default state

## FitMint Companion App (Android)

### Main Dashboard Screen

**Visible Elements:**
- App header with title
- Demo mode toggle button
- Connection status panel:
  - Health Connect status
  - Permissions status
  - Last sync timestamp
- Today's Activity panel:
  - Steps count
  - Exercise minutes
  - Calories burned
  - Distance traveled
- Refresh data button or exit demo mode button
- Open FitMint in World App button
- How it works information panel
- Enable demo mode button (if not in demo mode)

**User Interactions:**
- Check Health Connect connection status
- Grant health permissions
- View real-time health data
- Manually refresh health data
- Switch to demo mode
- Open FitMint in World App
- Learn how the app works

**States:**
1. **Not Connected**: Health Connect not installed or initialized
2. **No Permissions**: Health Connect connected but permissions not granted
3. **Connected**: Fully functional with data syncing
4. **Demo Mode**: Using simulated health data

### Health Permission Request Screen

**Visible Elements:**
- Permission explanation
- Grant permission button
- Open settings option

**User Interactions:**
- Learn about required permissions
- Grant health data access permissions
- Open Health Connect settings for manual configuration

### Demo User Selection Modal

**Visible Elements:**
- Modal title
- List of available demo profiles:
  - Casual Walker
  - Active Athlete
  - Fitness Beginner
- Selection indicators
- Cancel button

**User Interactions:**
- Select demo user profile with different fitness levels
- Test app with different fitness data
- Cancel selection to return to previous screen

## Data Flow Between Apps

1. **Android Companion App**:
   - Collects health data from Android Health Connect
   - Stores data locally with AsyncStorage
   - Syncs data to backend (or simulates sync in development)
   
2. **FitMint Mini App**:
   - Retrieves health data from backend API
   - Displays progress toward daily goals
   - Manages World ID verification
   - Handles WLD reward distribution
   - Provides social sharing functionality

## Demo User Scenarios

### Mini App Demo Users

1. **New User**
   - Not verified with World ID
   - Low step count (2,543 steps)
   - Low exercise minutes (8 minutes)

2. **Verified User**
   - Verified with World ID
   - Moderate step count (7,821 steps)
   - Moderate exercise (22 minutes)
   - 3-day streak

3. **Active Streak**
   - Verified with World ID
   - High step count (12,437 steps)
   - High exercise minutes (45 minutes)
   - 15-day streak
   - Eligible to claim today's reward

4. **Already Claimed**
   - Verified with World ID
   - High step count (11,245 steps)
   - High exercise minutes (38 minutes)
   - 7-day streak
   - Already claimed today's reward

### Companion App Demo Users

1. **Casual Walker**
   - 5,432 steps
   - 15 exercise minutes
   - 220 calories
   - 3.5 km distance

2. **Active Athlete**
   - 12,750 steps
   - 65 exercise minutes
   - 850 calories
   - 9.2 km distance

3. **Fitness Beginner**
   - 3,150 steps
   - 10 exercise minutes
   - 125 calories
   - 2.1 km distance
