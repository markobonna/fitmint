# FitMint Implementation Plan

This document outlines the detailed implementation plan to complete the FitMint mini app according to the specifications in the design documents. The plan focuses on the most critical components that need to be implemented or fixed.

## 1. MiniKit SDK Integration

### Current Status
- The app is using a mock implementation of the WorldCoin API
- The MiniKit provider is missing from the layout

### Implementation Steps
1. Install the proper MiniKit packages:
   ```bash
   cd packages/web
   pnpm add @worldcoin/minikit-js @worldcoin/minikit-react
   ```

2. Update the layout.tsx to properly implement the MiniKit provider:
   ```typescript
   // packages/web/app/layout.tsx
   import { MiniKitProvider } from "@worldcoin/minikit-react";
   
   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html lang="en">
         <body className={inter.className}>
           <MiniKitProvider appId={process.env.NEXT_PUBLIC_WORLD_APP_ID!}>
             {children}
           </MiniKitProvider>
         </body>
       </html>
     );
   }
   ```

3. Update page.tsx to use the proper MiniKit hooks:
   ```typescript
   // packages/web/app/page.tsx
   import { MiniKit } from '@worldcoin/minikit-js';
   import { useMiniKit } from '@worldcoin/minikit-react';
   
   export default function Home() {
     const { user, isInstalled } = useMiniKit();
     
     // Replace existing WorldCoin references with MiniKit
     // ...
   }
   ```

## 2. Environment Variables Setup

### Current Status
- No environment variables configuration found

### Implementation Steps
1. Create the .env.local file:
   ```bash
   # packages/web/.env.local
   NEXT_PUBLIC_WORLD_APP_ID=app_fitmint_staging
   NEXT_PUBLIC_API_URL=http://localhost:3000
   DATABASE_URL=postgresql://user:pass@localhost:5432/fitmint
   WORLD_APP_SECRET=your_secret_here
   ```

2. Add to .gitignore to ensure secrets aren't committed:
   ```
   # Add to .gitignore
   .env.local
   .env.*.local
   ```

3. Add documentation on how to set up environment variables.

## 3. Android Configuration

### Current Status
- Missing proper Android configuration for Health Connect

### Implementation Steps
1. Update build.gradle:
   ```gradle
   // packages/mobile/FitMintCompanion/android/build.gradle
   buildscript {
       ext {
           buildToolsVersion = "34.0.0"
           minSdkVersion = 26
           compileSdkVersion = 34
           targetSdkVersion = 34
           ndkVersion = "25.1.8937393"
       }
   }
   ```

2. Update app/build.gradle:
   ```gradle
   // packages/mobile/FitMintCompanion/android/app/build.gradle
   dependencies {
       implementation "androidx.health.connect:connect-client:1.1.0-alpha07"
       // ... other deps
   }
   ```

3. Update AndroidManifest.xml to add proper permissions:
   ```xml
   <!-- Add to packages/mobile/FitMintCompanion/android/app/src/main/AndroidManifest.xml -->
   <uses-permission android:name="android.permission.health.READ_STEPS" />
   <uses-permission android:name="android.permission.health.READ_EXERCISE" />
   <uses-permission android:name="android.permission.health.READ_HEART_RATE" />
   <uses-permission android:name="android.permission.health.READ_DISTANCE" />
   <uses-permission android:name="android.permission.health.READ_TOTAL_CALORIES_BURNED" />
   <uses-permission android:name="android.permission.INTERNET" />
   
   <queries>
       <package android:name="com.google.android.apps.healthdata" />
   </queries>
   ```

4. Update MainActivity.kt for Health Connect:
   ```kotlin
   // packages/mobile/FitMintCompanion/android/app/src/main/java/.../MainActivity.kt
   package com.fitmintcompanion
   
   import com.facebook.react.ReactActivity
   import com.facebook.react.ReactActivityDelegate
   import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
   import com.facebook.react.defaults.DefaultReactActivityDelegate
   import android.os.Bundle
   import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate
   
   class MainActivity : ReactActivity() {
       override fun onCreate(savedInstanceState: Bundle?) {
           super.onCreate(savedInstanceState)
           // Required for react-native-health-connect
           HealthConnectPermissionDelegate.setPermissionDelegate(this)
       }
   
       override fun getMainComponentName(): String = "FitMintCompanion"
   
       override fun createReactActivityDelegate(): ReactActivityDelegate =
           DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
   }
   ```

## 4. World App Manifest

### Current Status
- Missing manifest.json for World App integration

### Implementation Steps
1. Create the manifest.json file:
   ```bash
   # packages/web/public/manifest.json
   {
     "name": "FitMint",
     "short_name": "FitMint",
     "description": "Exercise to earn WLD daily",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#3b82f6",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/icon-512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

2. Create the icon files:
   - Create icon-192.png
   - Create icon-512.png

## 5. Backend Integration

### Current Status
- Using mock endpoints without real database integration

### Implementation Steps
1. Set up a database connection:
   ```typescript
   // packages/web/lib/db.ts
   import { Pool } from 'pg';
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });
   
   export default pool;
   ```

2. Update API endpoints to use the database:
   - Update health-data endpoint
   - Update user-profile endpoint
   - Update verify endpoint
   - Update claim endpoint

3. Create a sync endpoint for mobile app data:
   ```typescript
   // packages/web/app/api/sync/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import pool from '../../../lib/db';
   
   export async function POST(request: NextRequest) {
     const body = await request.json();
     const userId = request.headers.get('X-User-Id');
     
     // Store health data in database
     // ...
     
     return NextResponse.json({
       success: true,
       message: 'Data synced successfully',
     });
   }
   ```

## 6. Testing Setup

### Current Status
- Missing proper testing infrastructure

### Implementation Steps
1. Set up Jest for web app testing:
   ```bash
   cd packages/web
   pnpm add -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
   ```

2. Create test configuration:
   ```javascript
   // packages/web/jest.config.js
   module.exports = {
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
     // ...
   };
   ```

3. Set up mobile app testing:
   - Ensure React Native testing setup is correctly configured

## Timeline Estimation

1. MiniKit SDK Integration: 1 day
2. Environment Variables Setup: 0.5 day
3. Android Configuration: 1 day
4. World App Manifest: 0.5 day
5. Backend Integration: 2-3 days
6. Testing Setup: 1 day

Total estimated time: 6-7 days of development work

## Deployment Plan

1. Complete all the above implementation steps
2. Test locally with World App simulator
3. Deploy web app to Vercel
4. Test integration with World App in staging environment
5. Deploy Android app to internal testing
6. Conduct full integration testing
7. Prepare for production release
