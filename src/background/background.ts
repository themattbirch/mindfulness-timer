import { getStorageData, setStorageData } from '../utils/storage';

chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  setStorageData({
    interval: 15, // minutes
    soundEnabled: true,
    notificationsEnabled: true,
    theme: 'light'
  });
});

// Handle alarm for periodic notifications
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'mindfulnessReminder') {
    const { notificationsEnabled } = await getStorageData(['notificationsEnabled']);
    
    if (notificationsEnabled) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Mindfulness Reminder',
        message: 'Time to take a mindful break',
        buttons: [
          { title: 'Take Break' },
          { title: 'Snooze' }
        ],
        requireInteraction: true
      });
    }
  }
}); 