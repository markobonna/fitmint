'use client';

import { useState, useEffect } from 'react';
// Import Lucide React icons
import { Activity, Trophy, Users, TrendingUp } from 'lucide-react';

// Define interfaces for WorldCoin types
interface WorldCoinUser {
  username?: string;
  name?: string;
  profileImage?: string;
}

// Define the WorldCoin API interface
interface WorldCoinAPI {
  user?: WorldCoinUser;
  isInstalled?: boolean;
  commands?: {
    verify: (payload: any) => Promise<any>;
    pay: (payload: any) => Promise<any>;
    share: (payload: any) => Promise<any>;
  };
}

// Type declarations for global WorldCoin SDK access
declare global {
  interface Window {
    WorldCoin?: WorldCoinAPI;
  }
}

// Access WorldCoin API safely
const worldCoin = typeof window !== 'undefined' ? window.WorldCoin : null;

// Define types for verification process
interface VerificationProof {
  merkle_root: string;
  [key: string]: any;
}

interface VerificationResult {
  status: 'success' | 'error';
  proof: VerificationProof;
  [key: string]: any;
}

interface PaymentResult {
  status: 'success' | 'error';
  transactionId?: string;
  [key: string]: any;
}

interface HealthData {
  steps: number;
  exerciseMinutes: number;
  calories: number;
  lastSync: string;
}

interface UserProfile {
  verified: boolean;
  worldId: string;
  streak: number;
  totalClaimed: number;
  lastClaimDate: string | null;
}

export default function Home() {
  // Access worldCoin properties with fallbacks
  const [worldCoinUser, setWorldCoinUser] = useState<WorldCoinUser | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  
  // Initialize WorldCoin connection
  useEffect(() => {
    // Check if WorldCoin is available in the window object
    if (typeof window !== 'undefined' && window.WorldCoin) {
      setIsInstalled(!!window.WorldCoin.isInstalled);
      setWorldCoinUser(window.WorldCoin.user || { username: 'anonymous' });
    }
  }, []);
  const [healthData, setHealthData] = useState<HealthData>({
    steps: 0,
    exerciseMinutes: 0,
    calories: 0,
    lastSync: new Date().toISOString(),
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    verified: false,
    worldId: '',
    streak: 0,
    totalClaimed: 0,
    lastClaimDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [claimable, setClaimable] = useState(false);

  const STEP_GOAL = 10000;
  const EXERCISE_GOAL = 30; // minutes

  useEffect(() => {
    initializeApp();
    // Poll for health data from companion app
    const interval = setInterval(fetchHealthData, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if user can claim
    const goalMet = healthData.steps >= STEP_GOAL || healthData.exerciseMinutes >= EXERCISE_GOAL;
    const notClaimedToday = !userProfile.lastClaimDate || 
      new Date(userProfile.lastClaimDate).toDateString() !== new Date().toDateString();
    
    setClaimable(userProfile.verified && goalMet && notClaimedToday);
  }, [healthData, userProfile]);

  const initializeApp = async () => {
    if (!isInstalled) {
      console.log('Running in browser mode - mock data enabled');
      // Set mock data for testing
      setHealthData({
        steps: 7543,
        exerciseMinutes: 22,
        calories: 342,
        lastSync: new Date().toISOString(),
      });
    } else {
      // Load user profile from backend
      await fetchUserProfile();
    }
  };

  const fetchHealthData = async () => {
    try {
      // In production, this would fetch from your backend
      // which receives data from the React Native app
      const response = await fetch('/api/health-data', {
        headers: {
          'X-User-Id': worldCoinUser?.username || 'anonymous',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user-profile', {
        headers: {
          'X-User-Id': worldCoinUser?.username || 'anonymous',
        },
      });
      
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const payload = {
        action: 'fitness-verification',
        signal: 'unique-human',
        verification_level: 'device',
      };

      // Use WorldCoin API for verification if available
      let result;
      
      if (window.WorldCoin?.commands?.verify) {
        result = await window.WorldCoin.commands.verify(payload);
      } else {
        // Fallback for development/testing
        console.log('WorldCoin not available, using mock verification');
        result = {
          status: 'success',
          proof: { merkle_root: `0x${Math.random().toString(16).substring(2, 42)}` }
        };
      }
      
      if (result && result.status === 'success') {
        // Update profile with verification
        setUserProfile(prev => ({
          ...prev,
          verified: true,
          worldId: result.proof.merkle_root,
        }));
        
        // Save to backend
        await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: worldCoinUser?.username,
            proof: result.proof,
          }),
        });
      }
    } catch (error) {
      console.error('Verification failed:', error);
      alert('Verification failed. Please try again.');
    }
    setLoading(false);
  };

  const handleClaimReward = async () => {
    if (!claimable) return;
    
    setLoading(true);
    try {
      // First, verify the claim with backend
      const claimResponse = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: worldCoinUser?.username,
          steps: healthData.steps,
          exerciseMinutes: healthData.exerciseMinutes,
        }),
      });

      if (!claimResponse.ok) {
        throw new Error('Claim verification failed');
      }

      const { amount, reference } = await claimResponse.json();

      // Use the WorldCoin API for payment if available
      let paymentResult;
      
      if (window.WorldCoin?.commands?.pay) {
        paymentResult = await window.WorldCoin.commands.pay({
          amount: amount,
          currency: 'WLD',
          description: `Daily fitness reward - ${new Date().toLocaleDateString()}`,
          reference: reference
        });
      } else {
        // Fallback for development/testing
        console.log('WorldCoin not available, using mock payment');
        paymentResult = {
          status: 'success',
          transactionId: `tx-${Date.now()}`
        };
      }

      if (paymentResult && paymentResult.status === 'success') {
        // Update local state
        setUserProfile(prev => ({
          ...prev,
          streak: prev.streak + 1,
          totalClaimed: prev.totalClaimed + amount,
          lastClaimDate: new Date().toISOString(),
        }));

        // Show success message
        alert(`🎉 Claimed ${amount} WLD! Keep up the great work!` );
      }
    } catch (error) {
      console.error('Claim failed:', error);
      alert('Failed to claim reward. Please try again.');
    }
    setLoading(false);
  };

  const handleShare = async () => {
    try {
      // Use the WorldCoin API for sharing if available
      if (window.WorldCoin?.commands?.share) {
        await window.WorldCoin.commands.share({
          title: "I'm earning WLD by exercising! 💪",
          text: `${healthData.steps.toLocaleString()} steps today! Join me on FitMint.`,
          imageUrl: 'https://fitmint.world/share.png',
          url: 'worldapp://mini-app/fitmint',
        });
      } else {
        // Fallback for development/testing
        console.log('Share functionality not available');
        alert('Sharing would show: ' + `${healthData.steps.toLocaleString()} steps today! Join me on FitMint.`);
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const stepProgress = Math.min((healthData.steps / STEP_GOAL) * 100, 100);
  const exerciseProgress = Math.min((healthData.exerciseMinutes / EXERCISE_GOAL) * 100, 100);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              FitMint
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Earned</p>
              <p className="text-sm font-bold">{userProfile.totalClaimed} WLD</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Streak</p>
              <p className="text-sm font-bold">🔥 {userProfile.streak}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Verification Banner */}
        {!userProfile.verified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Verify to Start Earning</h3>
            <p className="text-sm text-yellow-700 mb-3">
              Verify with World ID to prove you're human and start earning WLD rewards.
            </p>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify with World ID'}
            </button>
          </div>
        )}

        {/* Today's Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Today's Progress</h2>
            <span className="text-xs text-gray-500">
              Last sync: {new Date(healthData.lastSync).toLocaleTimeString()}
            </span>
          </div>

          {/* Steps Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Steps</span>
              </div>
              <span className="text-sm font-bold">
                {healthData.steps.toLocaleString()} / {STEP_GOAL.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stepProgress}%`  }}
              />
            </div>
            {stepProgress >= 100 && (
              <p className="text-xs text-green-600 mt-1">✅ Goal achieved!</p>
            )}
          </div>

          {/* Exercise Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Exercise</span>
              </div>
              <span className="text-sm font-bold">
                {healthData.exerciseMinutes} / {EXERCISE_GOAL} min
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${exerciseProgress}%`  }}
              />
            </div>
            {exerciseProgress >= 100 && (
              <p className="text-xs text-green-600 mt-1">✅ Goal achieved!</p>
            )}
          </div>

          {/* Calories */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <span className="text-gray-600">Calories Burned</span>
            <span className="font-bold">{healthData.calories} kcal</span>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaimReward}
          disabled={!claimable || loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all transform ${
            claimable 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-[1.02] shadow-lg' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            'Processing...'
          ) : claimable ? (
            '🎉 Claim 1 WLD Reward'
          ) : userProfile.lastClaimDate && new Date(userProfile.lastClaimDate).toDateString() === new Date().toDateString() ? (
            '✅ Already Claimed Today'
          ) : !userProfile.verified ? (
            '🔒 Verify to Claim'
          ) : (
            `📊 ${Math.max(STEP_GOAL - healthData.steps, 0).toLocaleString()} steps to go` 
          )}
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={fetchHealthData}
            className="bg-white border border-gray-200 rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span className="font-medium">Refresh Data</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="bg-white border border-gray-200 rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="font-medium">Share</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Rank</p>
            <p className="text-lg font-bold">#1,234</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Friends</p>
            <p className="text-lg font-bold">12</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
            <Activity className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Avg Steps</p>
            <p className="text-lg font-bold">8.5k</p>
          </div>
        </div>
      </div>
    </main>
  );
}
