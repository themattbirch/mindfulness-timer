import { getStorageData, setStorageData } from '../utils/storage';
import { TimerState } from '../types/app';

// Add startTime/endTime in the default state.
const defaultTimerState: TimerState = {
  isActive: false,
  isPaused: false,
  timeLeft: 15 * 60,
  mode: 'custom',
  interval: 15,
  isBlinking: false,
  startTime: null,
  endTime: null
};

// Initialize settings and timer state on installation
chrome.runtime.onInstalled.addListener(() => {
  setStorageData({
    interval: 15,
    soundEnabled: true,
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js']
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  // Get the active tab ID
  const tabId = activeInfo.tabId;

  // (Optional) Use tabs.get to check its URL
  chrome.tabs.get(tabId, (tab) => {
    // If the URL is a normal webpage, re-inject the script
    if (tab && tab.url && /^https?:\/\//.test(tab.url)) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-script.js']
      });
    }
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
    default:
      sendResponse({ status: 'Unknown action' });
  }

  return true;
});

// Function to start the timer
async function startTimer(
  intervalInMinutes: number,
  mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom'
) {
  const now = Date.now();
  // exact endTime in ms
  const endTime = now + intervalInMinutes * 60 * 1000;

  const newTimerState: TimerState = {
    isActive: true,
    isPaused: false,
    timeLeft: intervalInMinutes * 60, // only for reference
    mode: mode,
    interval: intervalInMinutes,
    isBlinking: false,
    startTime: now,
    endTime
  };

  await setStorageData({ timerState: newTimerState });

  // Create an alarm for that exact moment
  chrome.alarms.clear('mindfulnessTimer');
  chrome.alarms.create('mindfulnessTimer', { when: endTime });
}

// Function to pause the timer
async function pauseTimer(timerState: TimerState) {
  if (timerState.isActive && !timerState.isPaused) {
    const now = Date.now();
    if (timerState.endTime) {
      const remaining = Math.max(0, timerState.endTime - now);
      const remainingSec = Math.floor(remaining / 1000);

      // clear alarm
      await chrome.alarms.clear('mindfulnessTimer');

      // Update the timer state with new leftover time
      const updated: TimerState = {
        ...timerState,
        isPaused: true,
        timeLeft: remainingSec,
        endTime: null // no active deadline
      };
      await setStorageData({ timerState: updated });
    }
  }
}

// Function to resume the timer
async function resumeTimer(timerState: TimerState) {
  if (timerState.isActive && timerState.isPaused && timerState.timeLeft > 0) {
    const now = Date.now();
    const newEndTime = now + timerState.timeLeft * 1000;

    const updated: TimerState = {
      ...timerState,
      isPaused: false,
      endTime: newEndTime,
      startTime: now
    };
    await setStorageData({ timerState: updated });

    // Reset the alarm
    chrome.alarms.clear('mindfulnessTimer');
    chrome.alarms.create('mindfulnessTimer', { when: newEndTime });
  }
}

// Function to reset the timer
async function resetTimer() {
  await setStorageData({ timerState: defaultTimerState });
  chrome.alarms.clear('mindfulnessTimer');
}

// Function to snooze the timer for 5 minutes
async function snoozeTimer() {
  const now = Date.now();
  const endTime = now + 5 * 60 * 1000;

  const newTimerState: TimerState = {
    ...defaultTimerState,
    isActive: true,
    timeLeft: 5 * 60,
    mode: 'shortBreak',
    interval: 5,
    startTime: now,
    endTime
  };

  await setStorageData({ timerState: newTimerState });
  chrome.alarms.clear('mindfulnessTimer');
  chrome.alarms.create('mindfulnessTimer', { when: endTime });
}

// Handle alarm for timer completion
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'mindfulnessTimer') {
    const storageData = await getStorageData(['soundEnabled', 'timerState']);
    const { soundEnabled } = storageData;
    const timerState: TimerState = storageData.timerState || defaultTimerState;

    if (timerState.isActive && !timerState.isPaused) {
      // Mark the timer as completed
      await setStorageData({ timerState: defaultTimerState });
      chrome.runtime.sendMessage({ action: 'timerCompleted' });
    }
  }
});
