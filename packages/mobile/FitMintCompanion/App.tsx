import React, { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  Button,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  openHealthConnectSettings,
} from 'react-native-health-connect';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'Distance' },
];

interface HealthData {
  steps: number;
  exerciseMinutes: number;
  calories: number;
  distance: number;
  lastSync: string;
}

// Define demo user profiles with mock data
interface MockUser {
  name: string;
  description: string;
  healthData: HealthData;
}

const DEMO_USERS: Record<string, MockUser> = {
  'casual': {
    name: 'Casual Walker',
    description: 'Someone who walks occasionally',
    healthData: {
      steps: 5432,
      exerciseMinutes: 15,
      calories: 220,
      distance: 3500,
      lastSync: new Date().toISOString(),
    }
  },
  'athlete': {
    name: 'Active Athlete',
    description: 'Fitness enthusiast who exercises daily',
    healthData: {
      steps: 12750,
      exerciseMinutes: 65,
      calories: 850,
      distance: 9200,
      lastSync: new Date().toISOString(),
    }
  },
  'beginner': {
    name: 'Fitness Beginner',
    description: 'Just starting their fitness journey',
    healthData: {
      steps: 3150,
      exerciseMinutes: 10,
      calories: 125,
      distance: 2100,
      lastSync: new Date().toISOString(),
    }
  },
};

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [healthData, setHealthData] = useState<HealthData>({
    steps: 0,
    exerciseMinutes: 0,
    calories: 0,
    distance: 0,
    lastSync: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Demo mode states
  const [demoMode, setDemoMode] = useState(false);
  const [activeDemoUser, setActiveDemoUser] = useState<string | null>(null);
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  useEffect(() => {
    initializeHealthConnect();
    
    // Check if demo mode was previously enabled
    AsyncStorage.getItem('demo_mode').then(value => {
      if (value === 'true') {
        setDemoMode(true);
        AsyncStorage.getItem('active_demo_user').then(user => {
          if (user && DEMO_USERS[user]) {
            setActiveDemoUser(user);
            setHealthData(DEMO_USERS[user].healthData);
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    if (hasPermissions) {
      fetchHealthData();
      // Set up periodic sync every 5 minutes
      const interval = setInterval(fetchHealthData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [hasPermissions]);

  const initializeHealthConnect = async () => {
    try {
      setLoading(true);
      const initialized = await initialize();
      setIsInitialized(initialized);

      if (initialized) {
        // Check if we already have permissions
        const savedPermissions = await AsyncStorage.getItem(
          'health_permissions',
        );
        if (savedPermissions === 'granted') {
          setHasPermissions(true);
        }
      }
    } catch (error) {
      console.error('Failed to initialize Health Connect:', error);
      Alert.alert(
        'Health Connect Not Available',
        'Please install or update Google Health Connect from Play Store',
        [
          {
            text: 'Open Play Store',
            onPress: () => {
              Linking.openURL(
                'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata',
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const requestHealthPermissions = async () => {
    try {
      setLoading(true);
      const granted = await requestPermission(PERMISSIONS);

      if (granted) {
        setHasPermissions(true);
        await AsyncStorage.setItem('health_permissions', 'granted');
        Alert.alert(
          'Success',
          'Health permissions granted! Now syncing your data...',
        );
        fetchHealthData();
      } else {
        Alert.alert(
          'Permissions Required',
          'Health data access is required to earn rewards. Please grant permissions in settings.',
          [
            { text: 'Open Settings', onPress: openHealthConnectSettings },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle demo mode
  const toggleDemoMode = async (enabled: boolean) => {
    setDemoMode(enabled);
    await AsyncStorage.setItem('demo_mode', enabled ? 'true' : 'false');
    
    if (!enabled) {
      setActiveDemoUser(null);
      await AsyncStorage.removeItem('active_demo_user');
      if (hasPermissions) {
        fetchHealthData();
      } else {
        setHealthData({
          steps: 0,
          exerciseMinutes: 0,
          calories: 0,
          distance: 0,
          lastSync: new Date().toISOString(),
        });
      }
    }
  };
  
  // Select a demo user
  const selectDemoUser = async (userId: string) => {
    if (DEMO_USERS[userId]) {
      setActiveDemoUser(userId);
      setHealthData(DEMO_USERS[userId].healthData);
      await AsyncStorage.setItem('active_demo_user', userId);
      setShowDemoSelector(false);
    }
  };
  
  const fetchHealthData = async () => {
    try {
      setSyncing(true);

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      // Fetch steps
      const stepRecords = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: now.toISOString(),
        },
      });

      const totalSteps = stepRecords.reduce(
        (sum, record) => sum + (record.count || 0),
        0,
      );

      // Fetch exercise sessions
      const exerciseRecords = await readRecords('ExerciseSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: now.toISOString(),
        },
      });

      const totalExerciseMinutes = exerciseRecords.reduce((sum, record) => {
        if (record.startTime && record.endTime) {
          const duration =
            new Date(record.endTime).getTime() -
            new Date(record.startTime).getTime();
          return sum + Math.floor(duration / 60000); // Convert to minutes
        }
        return sum;
      }, 0);

      // Fetch calories
      const calorieRecords = await readRecords('TotalCaloriesBurned', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: now.toISOString(),
        },
      });

      const totalCalories = calorieRecords.reduce(
        (sum, record) => sum + (record.energy?.value || 0),
        0,
      );

      // Fetch distance
      const distanceRecords = await readRecords('Distance', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: now.toISOString(),
        },
      });

      const totalDistance = distanceRecords.reduce(
        (sum, record) => sum + (record.distance?.value || 0),
        0,
      );

      const newHealthData = {
        steps: totalSteps,
        exerciseMinutes: totalExerciseMinutes,
        calories: Math.round(totalCalories),
        distance: Math.round(totalDistance), // meters
        lastSync: now.toISOString(),
      };

      setHealthData(newHealthData);

      // Store locally
      await AsyncStorage.setItem('health_data', JSON.stringify(newHealthData));

      // Send to mini app backend
      await syncWithBackend(newHealthData);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      Alert.alert(
        'Sync Error',
        'Failed to fetch health data. Please try again.',
      );
    } finally {
      setSyncing(false);
    }
  };

  const syncWithBackend = async (data: HealthData) => {
    try {
      // In production, this would send data to your backend
      // which the mini app can then retrieve
      const response = await fetch('https://fitmint.world/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': (await AsyncStorage.getItem('user_id')) || 'anonymous',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      console.log('Successfully synced with backend');
    } catch (error) {
      console.error('Backend sync failed:', error);
      // Store for retry later
      await AsyncStorage.setItem('pending_sync', JSON.stringify(data));
    }
  };

  const openMiniApp = () => {
    // Deep link to World App mini app
    Linking.openURL('worldapp://mini-app/fitmint').catch(() => {
      Alert.alert(
        'World App not installed',
        'Please install World App to claim rewards.',
      );
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Demo User Selection Modal */}
      <Modal
        visible={showDemoSelector}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl p-5 w-4/5 max-w-md">
            <Text className="text-xl font-bold mb-4">Select Demo User</Text>
            
            {Object.entries(DEMO_USERS).map(([id, user]) => (
              <TouchableOpacity
                key={id}
                onPress={() => selectDemoUser(id)}
                className={`p-4 border rounded-xl mb-2 ${activeDemoUser === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <Text className="font-medium text-base">{user.name}</Text>
                <Text className="text-sm text-gray-500">{user.description}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              onPress={() => setShowDemoSelector(false)}
              className="mt-4 bg-gray-200 p-3 rounded-xl"
            >
              <Text className="text-center font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold">
            FitMint Companion
          </Text>
          <TouchableOpacity 
            onPress={() => setShowDemoSelector(true)}
            className="bg-gray-100 px-3 py-1 rounded-full"
          >
            <Text className="text-sm font-medium text-gray-700">Demo Mode</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-gray-500 mt-1">
          {demoMode ? '🎮 Demo mode active' : 'Syncing health data for World App rewards'}
        </Text>
      </View>
      
      {/* Demo Mode Indicator */}
      {demoMode && activeDemoUser && (
        <View className="bg-yellow-100 px-4 py-2">
          <Text className="text-yellow-800 text-xs text-center">
            Demo Mode: {DEMO_USERS[activeDemoUser].name}
          </Text>
        </View>
      )}

      <ScrollView className="flex-1 px-4 py-4">
        {/* Connection Status */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <Text className="text-lg font-semibold mb-3">Connection Status</Text>

          <View className="space-y-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">Health Connect</Text>
              <View
                className={`px-2 py-1 rounded-full ${
                  isInitialized ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    isInitialized ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {isInitialized ? '✓ Connected' : '✗ Disconnected'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">Permissions</Text>
              <View
                className={`px-2 py-1 rounded-full ${
                  hasPermissions ? 'bg-green-100' : 'bg-yellow-100'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    hasPermissions ? 'text-green-700' : 'text-yellow-700'
                  }`}
                >
                  {hasPermissions ? '✓ Granted' : '⚠ Required'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">Last Sync</Text>
              <Text className="text-sm text-gray-700">
                {new Date(healthData.lastSync).toLocaleTimeString()}
              </Text>
            </View>
          </View>

          {!hasPermissions && (
            <TouchableOpacity
              onPress={requestHealthPermissions}
              disabled={loading}
              className="mt-4 bg-blue-600 rounded-xl py-3"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold">
                  Grant Health Permissions
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Health Data */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold">Today's Activity</Text>
            {demoMode ? (
              <View className="bg-yellow-100 px-2 py-1 rounded-full">
                <Text className="text-xs text-yellow-800">Demo Data</Text>
              </View>
            ) : (
              syncing && <ActivityIndicator size="small" color="#3B82F6" />
            )}
          </View>

          <View className="space-y-3">
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Steps</Text>
              <Text className="text-xl font-bold">
                {healthData.steps.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Exercise</Text>
              <Text className="text-xl font-bold">
                {healthData.exerciseMinutes} min
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Calories</Text>
              <Text className="text-xl font-bold">
                {healthData.calories} kcal
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-2">
              <Text className="text-gray-600">Distance</Text>
              <Text className="text-xl font-bold">
                {(healthData.distance / 1000).toFixed(1)} km
              </Text>
            </View>
          </View>

          {demoMode ? (
            <TouchableOpacity
              onPress={() => toggleDemoMode(false)}
              className="mt-4 bg-red-100 rounded-xl py-3"
            >
              <Text className="text-red-700 text-center font-medium">
                Exit Demo Mode
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={fetchHealthData}
              disabled={syncing}
              className="mt-4 bg-gray-100 rounded-xl py-3"
            >
              <Text className="text-gray-700 text-center font-medium">
                {syncing ? 'Syncing...' : 'Refresh Data'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Open Mini App */}
        <TouchableOpacity
          onPress={openMiniApp}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl py-4 mb-4"
        >
          <Text className="text-white text-center font-bold text-lg">
            Open FitMint in World App
          </Text>
          <Text className="text-white/80 text-center text-sm mt-1">
            Claim your rewards
          </Text>
        </TouchableOpacity>
        {/* Info */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-4">
          <Text className="text-blue-900 font-semibold mb-2">How it works</Text>
          <Text className="text-blue-700 text-sm leading-5">
            1. This app syncs your health data from Google Fit{"\n"}
            2. Data is sent securely to FitMint servers{"\n"}
            3. Open FitMint in World App to claim WLD rewards{"\n"}
            4. Earn 1 WLD daily for 10,000 steps or 30 min exercise
          </Text>
        </View>
        
        {/* Demo Mode Button */}
        {!demoMode && (
          <TouchableOpacity
            onPress={() => toggleDemoMode(true)}
            className="bg-gray-200 rounded-2xl p-4 mb-4 border border-gray-300"
          >
            <Text className="text-center font-medium text-gray-700">Enable Demo Mode</Text>
            <Text className="text-center text-sm text-gray-500 mt-1">
              Try the app with simulated fitness data
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Demo Mode Indicator */}
        {demoMode && (
          <View className="bg-yellow-100 px-4 py-2">
            <Text className="text-yellow-800 text-xs text-center">
              Demo Mode: Simulated fitness data
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const DEMO_USERS = {
  user1: {
    name: 'John Doe',
    description: 'Average fitness level',
    steps: 10000,
    exerciseMinutes: 30,
    calories: 2000,
    distance: 5000,
  },
  user2: {
    name: 'Jane Doe',
    description: 'High fitness level',
    steps: 20000,
    exerciseMinutes: 60,
    calories: 4000,
    distance: 10000,
  },
};
