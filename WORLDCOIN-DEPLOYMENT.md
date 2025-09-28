# Deploying FitMint to WorldCoin Developer Portal

This guide provides step-by-step instructions for deploying the FitMint app to both Vercel and the WorldCoin Developer Portal.

## 1. Deploy to Vercel

### Prerequisites

- A Vercel account
- GitHub account with the FitMint repository

### Deployment Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Visit https://vercel.com/new
   - Import your GitHub repository
   - Select "fitmint" repository

3. **Configure Project Settings**
   - Framework Preset: Next.js
   - Root Directory: packages/web
   - Build Command: `cd ../.. && pnpm install && cd packages/web && pnpm build`
   - Output Directory: .next
   - Install Command: `pnpm install`
   - Development Command: `pnpm dev`

4. **Configure Environment Variables** (if needed)
   - Add any required environment variables

5. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete
   - Note the deployment URL (e.g., `fitmint-xyz123.vercel.app`)

## 2. Submit to WorldCoin Developer Portal

### Prerequisites

- WorldCoin Developer Portal account
- Successfully deployed app on Vercel

### Submission Steps

1. **Log in to WorldCoin Developer Portal**
   - Visit https://developer.worldcoin.org
   - Sign in with your account

2. **Create New Mini App**
   - Click on "Create New Mini App"
   - Fill in the required information:
     - Mini App Name: FitMint
     - Mini App ID: fitmint
     - Category: Health & Fitness
     - Description: Exercise to earn WLD rewards daily
     - Developer Information

3. **Configure Mini App Settings**
   - App URL: Your Vercel deployment URL
   - Required Permissions:
     - verify
     - pay
     - share
   - Privacy Policy URL: GitHub repo URL + /PRIVACY.md
   - Terms of Service URL: GitHub repo URL + /TERMS.md
   - Support URL: GitHub repo URL

4. **Upload Icons and Screenshots**
   - Add app icon (512x512)
   - Add screenshots showcasing main functionality
   - Add app preview images

5. **Test Your Mini App**
   - Scan the provided QR code with World App
   - Test all functionality
   - Verify that demo mode works correctly
   - Test each demo user profile

6. **Submit for Review**
   - Provide additional notes for reviewers
   - Highlight the demo mode feature for easy testing
   - Submit for official review

## Important Deployment Notes

### Repository Structure for Deployment

When deploying the FitMint monorepo to Vercel, we're specifically deploying the web package, not the entire repository. This approach allows Vercel to properly build and serve the Next.js application.

The `vercel.json` configuration in the root directory helps Vercel understand how to handle the monorepo structure:

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
  ],
  "github": {
    "silent": true
  }
}
```

### World App Mini App Requirements

The `manifest.json` file in the web package's public directory contains the required World App configuration:

```json
{
  "world_app": {
    "mini_app_id": "fitmint",
    "required_permissions": [
      "verify",
      "pay",
      "share"
    ],
    "developer_id": "markobonna",
    "category": "health",
    "localized_metadata": {
      "en": {
        "name": "FitMint",
        "subtitle": "Exercise to Earn",
        "description": "Earn WLD rewards for daily exercise with our human-verified fitness app"
      }
    }
  }
}
```

### Troubleshooting Deployment Issues

If you encounter issues during deployment:

1. **Build Errors**
   - Check Vercel build logs
   - Verify that all dependencies are properly installed
   - Check that the build command is correctly targeting the web package

2. **World App Integration Issues**
   - Verify that your manifest.json has the correct world_app configuration
   - Check that your app correctly handles World App commands
   - Test with the World App Developer Mode
   
3. **Demo Mode Issues**
   - Ensure that demo users are properly configured
   - Test all demo user scenarios
