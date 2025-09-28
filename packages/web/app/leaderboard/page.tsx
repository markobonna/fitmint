'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  totalSteps: number;
  streak: number;
  totalWLD: number;
  change: 'up' | 'down' | 'same';
}

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'allTime'>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);
  
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
        setUserRank(data.userRank);
      } else {
        // Mock data for development
        const mockData = generateMockLeaderboard();
        setLeaderboard(mockData.leaderboard);
        setUserRank(mockData.userRank);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Fallback to mock data
      const mockData = generateMockLeaderboard();
      setLeaderboard(mockData.leaderboard);
      setUserRank(mockData.userRank);
    }
    setLoading(false);
  };

  const generateMockLeaderboard = () => {
    const names = ['Alex Runner', 'Sarah Sprint', 'Mike Miles', 'Lisa Leap', 'Tom Trek', 'Emma Endure', 'Jake Jog', 'Maya March'];
    const avatars = names.map((_, i) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`);
    
    const leaderboard = names.map((name, index) => ({
      rank: index + 1,
      username: name,
      avatar: avatars[index],
      totalSteps: Math.max(150000 - (index * 15000) + Math.random() * 10000, 50000),
      streak: Math.floor(Math.random() * 30) + 1,
      totalWLD: Math.floor((150 - index * 15) + Math.random() * 20),
      change: ['up', 'down', 'same'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'same'
    }));

    const userRank = {
      rank: 12,
      username: 'You',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      totalSteps: 89500,
      streak: 5,
      totalWLD: 67,
      change: 'up' as const
    };

    return { leaderboard, userRank };
  };
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-600" />;
      default: return <span className="font-bold text-gray-600">#{rank}</span>;
    }
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
          </div>
          
          {/* Timeframe selector */}
          <div className="flex gap-2">
            {(['daily', 'weekly', 'allTime'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tf === 'allTime' ? 'All Time' : tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* User's rank card */}
        {userRank && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Your Rank</p>
                <p className="text-3xl font-bold">#{userRank.rank}</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm mb-1">Total Steps</p>
                <p className="text-2xl font-bold">{userRank.totalSteps.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-white/80 text-xs">Streak</p>
                <p className="font-bold">🔥 {userRank.streak} days</p>
              </div>
              <div>
                <p className="text-white/80 text-xs">Earned</p>
                <p className="font-bold">{userRank.totalWLD} WLD</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Top performers */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={`${entry.username}-${entry.rank}`}
                className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
                  entry.rank <= 3 ? 'border-yellow-200 bg-yellow-50/50' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <img
                    src={entry.avatar}
                    alt={entry.username}
                    className="w-12 h-12 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${entry.username}`;
                    }}
                  />
                  
                  <div className="flex-1">
                    <p className="font-semibold">{entry.username}</p>
                    <p className="text-sm text-gray-500">
                      {entry.totalSteps.toLocaleString()} steps
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold">{entry.totalWLD} WLD</p>
                    <div className="flex items-center gap-1 justify-end">
                      {entry.change === 'up' && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                      <p className="text-xs text-gray-500">🔥 {entry.streak}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Challenge CTA */}
        <div className="mt-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-purple-600" />
            <h3 className="font-bold text-lg">Weekend Challenge</h3>
          </div>
          <p className="text-gray-700 mb-4">
            Join 1,234 others competing for 500 WLD prize pool!
          </p>
          <button className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition-colors">
            Join Challenge
          </button>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="font-semibold mb-4">Global Stats</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">12.5M</p>
              <p className="text-sm text-gray-500">Total Steps Today</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">3,847</p>
              <p className="text-sm text-gray-500">Active Users</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">15,623</p>
              <p className="text-sm text-gray-500">WLD Distributed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">89%</p>
              <p className="text-sm text-gray-500">Goal Achievement</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}