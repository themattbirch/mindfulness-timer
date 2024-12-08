// src/background/background.ts

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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTimer') {
    chrome.alarms.create('mindfulnessReminder', { delayInMinutes: message.interval });
    sendResponse({ status: 'Timer started' });
  } else if (message.action === 'stopTimer') {
    chrome.alarms.clear('mindfulnessReminder');
    sendResponse({ status: 'Timer stopped' });
  }
});

// Handle alarm for periodic notifications
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'mindfulnessReminder') {
    const { notificationsEnabled } = await getStorageData(['notificationsEnabled']);
    
    if (notificationsEnabled) {
      const quotes = [
        {
          text: "Take a deep breath and relax.",
          author: "Unknown"
        },
        {
          text: "Stay present and mindful.",
          author: "Thich Nhat Hanh"
        },
        // Add more quotes...
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Mindfulness Reminder',
        message: randomQuote.text + ` — ${randomQuote.author}`,
        buttons: [
          { title: 'Take Break' },
          { title: 'Snooze' }
        ],
        requireInteraction: true
      });
    }
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'mindfulnessReminder') {
    if (buttonIndex === 0) {
      // Take Break
      chrome.notifications.clear(notificationId);
      // Implement break logic
    } else if (buttonIndex === 1) {
      // Snooze
      chrome.notifications.clear(notificationId);
      chrome.alarms.create('mindfulnessReminder', { delayInMinutes: 5 });
    }
  }
});
