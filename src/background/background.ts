// src/background/background.ts

import { getStorageData, setStorageData } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { TimerState } from '../types/app';

// Define the shape of the timer state
const defaultTimerState: TimerState = {
  isActive: false,
  isPaused: false,
  timeLeft: 0,
  mode: 'focus',
  interval: 15
};

// Initialize settings and timer state on installation
chrome.runtime.onInstalled.addListener(() => {
  setStorageData({
    interval: 15, // minutes
    soundEnabled: true,
    notificationsEnabled: true,
    theme: 'light',
    timerState: defaultTimerState
  });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const storageData = await getStorageData(['timerState']);
  const timerState: TimerState = storageData.timerState || defaultTimerState;

  switch (message.action) {
    case 'startTimer':
      await startTimer(message.interval, message.mode);
      sendResponse({ status: 'Timer started' });
      break;
    case 'pauseTimer':
      await pauseTimer(timerState);
      sendResponse({ status: 'Timer paused' });
      break;
    case 'resumeTimer':
      await resumeTimer(timerState);
      sendResponse({ status: 'Timer resumed' });
      break;
    case 'resetTimer':
      await resetTimer();
      sendResponse({ status: 'Timer reset' });
      break;
    case 'snoozeTimer':
      await snoozeTimer();
      sendResponse({ status: 'Timer snoozed for 5 minutes' });
      break;
    case 'takeBreak':
      // Open the popup window when 'Take Break' is clicked
      chrome.windows.create({
        url: chrome.runtime.getURL("index.html"),
        type: "popup",
        width: 400,
        height: 600
      });
      sendResponse({ status: 'Break window opened' });
      break;
    default:
      sendResponse({ status: 'Unknown action' });
  }

  return true; // Indicates that the response is sent asynchronously
});

// Function to start the timer
async function startTimer(intervalInMinutes: number, mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom') {
  const timerState: TimerState = {
    isActive: true,
    isPaused: false,
    timeLeft: intervalInMinutes * 60,
    mode: mode,
    interval: intervalInMinutes
  };
  await setStorageData({ timerState });

  // Create an alarm for when the timer completes
  chrome.alarms.create('mindfulnessTimer', { delayInMinutes: intervalInMinutes });
}

// Function to pause the timer
async function pauseTimer(timerState: TimerState) {
  if (timerState.isActive && !timerState.isPaused) {
    // Calculate remaining time
    chrome.alarms.get('mindfulnessTimer', async (alarm) => {
      if (alarm) {
        const now = Date.now();
        const scheduledTime = alarm.scheduledTime;
        const remainingTime = Math.max(0, Math.floor((scheduledTime - now) / 1000));
        // Clear the existing alarm
        const wasCleared = await chrome.alarms.clear('mindfulnessTimer');
        if (wasCleared) {
          // Update the timer state with remaining time and paused status
          const updatedTimerState: TimerState = {
            ...timerState,
            isPaused: true,
            timeLeft: remainingTime
          };
          await setStorageData({ timerState: updatedTimerState });
        }
      }
    });
  }
}

// Function to resume the timer
async function resumeTimer(timerState: TimerState) {
  if (timerState.isActive && timerState.isPaused && timerState.timeLeft > 0) {
    const remainingMinutes = timerState.timeLeft / 60;
    await setStorageData({ timerState: { ...timerState, isPaused: false } });
    chrome.alarms.create('mindfulnessTimer', { delayInMinutes: remainingMinutes });
  }
}

// Function to reset the timer
async function resetTimer() {
  await setStorageData({ timerState: defaultTimerState });
  chrome.alarms.clear('mindfulnessTimer');
}

// Function to snooze the timer for 5 minutes
async function snoozeTimer() {
  await setStorageData({
    timerState: {
      ...defaultTimerState,
      isActive: true,
      timeLeft: 5 * 60,
      mode: 'shortBreak',
      interval: 5
    }
  });
  chrome.alarms.create('mindfulnessTimer', { delayInMinutes: 5 });
}

// Handle alarm for timer completion
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'mindfulnessTimer') {
    const storageData = await getStorageData(['notificationsEnabled', 'soundEnabled', 'timerState']);
    const { notificationsEnabled } = storageData;
    const timerState: TimerState = storageData.timerState || defaultTimerState;

    if (timerState.isActive && !timerState.isPaused) {
      // Show notification if enabled
      if (notificationsEnabled) {
        const randomQuote = getRandomQuote();
        const notificationId = `mindfulnessReminder-${uuidv4()}`;
        chrome.notifications.create(notificationId, {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon128.png'),
          title: 'Time for a Mindful Break',
          message: `${randomQuote.text} — ${randomQuote.author}`,
          buttons: [
            { title: 'Take Break' },
            { title: 'Snooze' }
          ],
          requireInteraction: true
        });
      }

      // Reset timer state
      await setStorageData({ timerState: defaultTimerState });
    }
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId.startsWith('mindfulnessReminder-')) {
    if (buttonIndex === 0) {
      // Take Break: Open the popup window
      chrome.runtime.sendMessage({ action: 'takeBreak' });
      chrome.notifications.clear(notificationId);
    } else if (buttonIndex === 1) {
      // Snooze
      chrome.notifications.clear(notificationId);
      await snoozeTimer();
    }
  }
});

// Function to get a random quote
function getRandomQuote() {
  const quotes = [
    {
      text: "Take a deep breath and relax.",
      author: "Unknown"
    },
    {
      text: "Stay present and mindful.",
      author: "Thich Nhat Hanh"
    },
    {
      text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
      author: "Thich Nhat Hanh"
    },
    {
      text: "Mindfulness isn't difficult, we just need to remember to do it.",
      author: "Sharon Salzberg"
    },
    // Add more quotes as desired
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Removed the playSound function from background.ts
