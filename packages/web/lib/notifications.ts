import { MiniKit } from '@worldcoin/minikit-js';

export class NotificationService {
  private static instance: NotificationService;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }
  
  async requestPermission(): Promise<boolean> {
    try {
      if (!MiniKit.isInstalled()) {
        console.warn('MiniKit not available for notifications');
        return false;
      }
      
      // For MiniKit, notification permissions are typically handled automatically
      // This is a placeholder for when the API supports permission requests
      return true;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }
  
  async scheduleReminder(time: string, message: string) {
    try {
      if (!MiniKit.isInstalled()) {
        console.warn('MiniKit not available for scheduled notifications');
        return;
      }
      
      // Schedule a local notification
      await this.sendNotification({
        title: 'FitMint Reminder',
        body: message,
        data: { type: 'reminder', scheduledFor: time }
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }
  
  async sendAchievement(achievement: string, streak?: number) {
    try {
      const title = streak 
        ? `🎉 ${streak} Day Streak!` 
        : '🎉 Achievement Unlocked!';
        
      await this.sendNotification({
        title,
        body: achievement,
        data: { 
          type: 'achievement', 
          streak: streak?.toString() || '0'
        }
      });
    } catch (error) {
      console.error('Failed to send achievement notification:', error);
    }
  }
  
  async sendDailyProgress(steps: number, goal: number = 10000) {
    const remaining = goal - steps;
    const percentage = Math.round((steps / goal) * 100);
    
    try {
      if (remaining > 0 && remaining <= 2000 && percentage >= 80) {
        await this.sendNotification({
          title: 'Almost there! 🏃',
          body: `Only ${remaining.toLocaleString()} steps to earn your WLD! You're at ${percentage}%`,
          data: { 
            type: 'progress',
            steps: steps.toString(),
            remaining: remaining.toString(),
            percentage: percentage.toString()
          }
        });
      }
    } catch (error) {
      console.error('Failed to send progress notification:', error);
    }
  }
  
  async sendStreakReminder(streak: number) {
    try {
      let message = '';
      let emoji = '🔥';
      
      if (streak >= 30) {
        message = `Incredible ${streak}-day streak! You're a fitness legend! 🏆`;
        emoji = '🏆';
      } else if (streak >= 7) {
        message = `Amazing ${streak}-day streak! Keep the momentum going! 💪`;
        emoji = '💪';
      } else {
        message = `${streak}-day streak going strong! 🔥`;
      }
      
      await this.sendNotification({
        title: `${emoji} Streak Update`,
        body: message,
        data: { 
          type: 'streak',
          streak: streak.toString()
        }
      });
    } catch (error) {
      console.error('Failed to send streak notification:', error);
    }
  }
  
  async sendChallengeNotification(type: 'joined' | 'completed' | 'winner', challengeName: string, prize?: number) {
    try {
      let title = '';
      let body = '';
      
      switch (type) {
        case 'joined':
          title = '🎯 Challenge Joined!';
          body = `You've joined "${challengeName}". Good luck!`;
          break;
        case 'completed':
          title = '✅ Challenge Complete!';
          body = `You've completed "${challengeName}"! Check your results.`;
          break;
        case 'winner':
          title = '🏆 You Won!';
          body = `Congratulations! You won "${challengeName}" and earned ${prize} WLD!`;
          break;
      }
      
      await this.sendNotification({
        title,
        body,
        data: { 
          type: 'challenge',
          challengeType: type,
          challengeName,
          prize: prize?.toString() || '0'
        }
      });
    } catch (error) {
      console.error('Failed to send challenge notification:', error);
    }
  }
  
  async sendRewardClaimed(amount: number, steps: number, exerciseMinutes: number) {
    try {
      const title = '💰 Reward Claimed!';
      const body = `You earned ${amount} WLD for ${steps.toLocaleString()} steps and ${exerciseMinutes} minutes of exercise!`;
      
      await this.sendNotification({
        title,
        body,
        data: { 
          type: 'reward',
          amount: amount.toString(),
          steps: steps.toString(),
          exercise: exerciseMinutes.toString()
        }
      });
    } catch (error) {
      console.error('Failed to send reward notification:', error);
    }
  }
  
  async sendGoalReminder(timeUntilReset: number) {
    try {
      const hours = Math.ceil(timeUntilReset / (1000 * 60 * 60));
      
      if (hours <= 3) {
        await this.sendNotification({
          title: '⏰ Time Running Out!',
          body: `Only ${hours} hours left to reach your daily fitness goals and earn WLD!`,
          data: { 
            type: 'reminder',
            timeLeft: hours.toString()
          }
        });
      }
    } catch (error) {
      console.error('Failed to send goal reminder:', error);
    }
  }
  
  private async sendNotification(notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    try {
      // For web environments, we can use the Web Notifications API as fallback
      if (typeof window !== 'undefined' && 'Notification' in window) {
        // Check if we have permission
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: notification.data,
            requireInteraction: false,
            silent: false
          });
        } else if (Notification.permission === 'default') {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification(notification.title, {
              body: notification.body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              data: notification.data
            });
          }
        }
      }
      
      // Also log for debugging
      console.log('📱 Notification:', notification.title, '-', notification.body);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
}

// Notification scheduling helpers
export const scheduleNotifications = {
  async scheduleDailyReminders(userPreferences: {
    morningReminder?: boolean;
    afternoonReminder?: boolean;
    eveningReminder?: boolean;
  }) {
    const notificationService = NotificationService.getInstance();
    
    if (userPreferences.morningReminder) {
      await notificationService.scheduleReminder(
        '09:00',
        'Good morning! Ready to start your fitness journey today? 🌅'
      );
    }
    
    if (userPreferences.afternoonReminder) {
      await notificationService.scheduleReminder(
        '14:00',
        'Afternoon break time! How about a quick walk? 🚶‍♀️'
      );
    }
    
    if (userPreferences.eveningReminder) {
      await notificationService.scheduleReminder(
        '19:00',
        'Evening check-in! Have you reached your fitness goals today? 🌅'
      );
    }
  },

  async scheduleProgressChecks() {
    const notificationService = NotificationService.getInstance();
    
    // Schedule progress notifications for every few hours
    const checkTimes = ['12:00', '15:00', '18:00', '21:00'];
    
    for (const time of checkTimes) {
      await notificationService.scheduleReminder(
        time,
        'Time for a progress check! See how close you are to your goals 📊'
      );
    }
  }
};

// Export singleton instance
export const notifications = NotificationService.getInstance();