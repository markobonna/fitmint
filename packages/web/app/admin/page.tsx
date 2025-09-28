'use client';

import { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, DollarSign, Activity, 
  AlertCircle, Settings, Database, Globe,
  RefreshCw, Pause, Play, Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Metrics {
  totalUsers: number;
  activeUsers: number;
  dailyActiveUsers: number;
  totalRewardsDistributed: number;
  averageStepsPerUser: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
  pendingClaims: number;
  fraudAlerts: number;
  todayTotalSteps: number;
  todayGoalAchievement: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [systemPaused, setSystemPaused] = useState(false);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/admin/metrics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        // Mock data for development
        setMetrics(generateMockMetrics());
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      // Fallback to mock data
      setMetrics(generateMockMetrics());
    }
    setLoading(false);
  };

  const generateMockMetrics = (): Metrics => ({
    totalUsers: 12547,
    activeUsers: 3847,
    dailyActiveUsers: 1523,
    totalRewardsDistributed: 156230,
    averageStepsPerUser: 8342,
    systemHealth: Math.random() > 0.1 ? 'healthy' : 'degraded',
    pendingClaims: Math.floor(Math.random() * 50) + 10,
    fraudAlerts: Math.floor(Math.random() * 5),
    todayTotalSteps: 12500000,
    todayGoalAchievement: 89
  });

  const generateChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      name: day,
      users: Math.floor(Math.random() * 2000) + 1000,
      rewards: Math.floor(Math.random() * 5000) + 2000,
      steps: Math.floor(Math.random() * 2000000) + 8000000
    }));
  };

  const chartData = generateChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-600">Failed to load metrics</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FitMint Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Real-time metrics and system monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button 
                onClick={fetchMetrics}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* System Status Alert */}
        <div className={`rounded-lg p-4 mb-6 ${
          metrics.systemHealth === 'healthy' ? 'bg-green-100 border-green-200' :
          metrics.systemHealth === 'degraded' ? 'bg-yellow-100 border-yellow-200' : 'bg-red-100 border-red-200'
        } border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className={`w-6 h-6 ${
                metrics.systemHealth === 'healthy' ? 'text-green-600' :
                metrics.systemHealth === 'degraded' ? 'text-yellow-600' : 'text-red-600'
              }`} />
              <span className="font-semibold capitalize">
                System Status: {metrics.systemHealth}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {metrics.fraudAlerts > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>{metrics.fraudAlerts} fraud alerts</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSystemPaused(!systemPaused)}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium ${
                    systemPaused ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}
                >
                  {systemPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      Resume System
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause System
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={metrics.totalUsers.toLocaleString()}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            change="+12.5%"
            positive
          />
          
          <MetricCard
            title="Daily Active Users"
            value={metrics.dailyActiveUsers.toLocaleString()}
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            change="+8.3%"
            positive
          />
          
          <MetricCard
            title="WLD Distributed"
            value={`${(metrics.totalRewardsDistributed / 1000).toFixed(0)}K`}
            icon={<DollarSign className="w-6 h-6 text-purple-600" />}
            change="+15.2%"
            positive
          />
          
          <MetricCard
            title="Avg Steps/User"
            value={metrics.averageStepsPerUser.toLocaleString()}
            icon={<Activity className="w-6 h-6 text-orange-600" />}
            change="-2.1%"
            positive={false}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold mb-4">Daily Active Users</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Reward Distribution Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold mb-4">WLD Rewards Distributed</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rewards" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Activity Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold mb-4">Today's Activity</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Steps</span>
                <span className="font-semibold">{metrics.todayTotalSteps.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Claims</span>
                <span className="font-semibold text-orange-600">{metrics.pendingClaims}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Goal Achievement</span>
                <span className="font-semibold text-green-600">{metrics.todayGoalAchievement}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold mb-4">System Resources</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Memory Usage</span>
                  <span className="text-sm">67%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '67%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">CPU Usage</span>
                  <span className="text-sm">34%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '34%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Cache Hit Rate</span>
                  <span className="text-sm">94%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: '94%'}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span>High memory usage detected</span>
                <span className="text-gray-400 ml-auto">2h ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>Fraud pattern detected</span>
                <span className="text-gray-400 ml-auto">4h ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Activity className="w-4 h-4 text-green-500" />
                <span>System backup completed</span>
                <span className="text-gray-400 ml-auto">6h ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Management Actions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ActionButton icon={<Users />} text="User Management" />
            <ActionButton icon={<TrendingUp />} text="Create Challenge" />
            <ActionButton icon={<Settings />} text="Adjust Rewards" />
            <ActionButton icon={<Database />} text="Backup Data" />
            <ActionButton icon={<Download />} text="Export Reports" />
            <ActionButton icon={<Globe />} text="System Status" danger />
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ title, value, icon, change, positive }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
      <p className="text-gray-600 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ActionButton({ icon, text, danger = false }: {
  icon: React.ReactNode;
  text: string;
  danger?: boolean;
}) {
  return (
    <button className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
      danger 
        ? 'border-red-200 hover:bg-red-50 text-red-600' 
        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
    }`}>
      <div className="w-6 h-6">
        {icon}
      </div>
      <span className="text-sm font-medium text-center">{text}</span>
    </button>
  );
}