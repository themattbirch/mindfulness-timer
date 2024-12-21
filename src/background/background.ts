// src/background/background.ts

import { getStorageData, setStorageData } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { TimerState } from '../types/app';

// Define the shape of the timer state
const defaultTimerState: TimerState = {
  isActive: false,
  isPaused: false,
  timeLeft: 15 * 60, // 15 minutes in seconds
  mode: 'custom', // Set to 'custom' to align with default interval
  interval: 15, // minutes
  isBlinking: false // Added property
};

// Initialize settings and timer state on installation
chrome.runtime.onInstalled.addListener(() => {
  setStorageData({
    interval: 15, // minutes
    soundEnabled: true,
    notificationsEnabled: true, // Optional: Can be removed if not needed elsewhere
    theme: 'light',
    soundVolume: 50,
    autoStartTimer: false,
    showQuotes: true,
    quoteChangeInterval: 60,
    selectedSound: 'gentle-bell',
    timerMode: 'custom',
    quoteCategory: 'all',
    minimalMode: false,
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
    // Removed 'takeBreak' action as notifications are no longer present
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
    interval: intervalInMinutes,
    isBlinking: false // Added property
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
            // isBlinking remains unchanged
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
      interval: 5,
      isBlinking: false // Added property
    }
  });
  chrome.alarms.create('mindfulnessTimer', { delayInMinutes: 5 });
}

// Handle alarm for timer completion
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'mindfulnessTimer') {
    const storageData = await getStorageData(['soundEnabled', 'timerState']);
    const { soundEnabled } = storageData;
    const timerState: TimerState = storageData.timerState || defaultTimerState;

    if (timerState.isActive && !timerState.isPaused) {
      // Play sound if enabled
      if (soundEnabled) {
        // Sound playback is handled in the popup via 'timerCompleted' message
        // No action needed here
      }

      // Reset timer state
      await setStorageData({ timerState: defaultTimerState });

      // Notify the popup to play the sound and start blinking
      chrome.runtime.sendMessage({ action: 'timerCompleted' });
    }
  }
});
