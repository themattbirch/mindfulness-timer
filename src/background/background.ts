/// <reference types="chrome"/>

import { getStorageData, setStorageData } from '../utils/storage';
import { TimerState, StorageData } from '../types/app';
import { AppSettings } from '../types/app';

let lastActivity: number = Date.now();
let activeWidgetTabs = new Set<number>();

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

const defaultAppSettings: AppSettings = {
  interval: 15,
  soundEnabled: true,
  theme: 'light',
  soundVolume: 50,
  autoStartTimer: false,
  showQuotes: true,
  quoteChangeInterval: 60,
  selectedSound: 'gentle-bell',
  timerMode: 'focus',
  quoteCategory: 'all',
  minimalMode: false,
};

chrome.runtime.onInstalled.addListener(async () => {
  await setStorageData({
    ...defaultAppSettings,
    timerState: defaultTimerState,
  });
  console.log('[Background] Extension installed and default settings set.');
});

chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: 'index.html',   // Or some other internal page
    type: 'popup',
    width: 400,
    height: 600,
    focused: true
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  activeWidgetTabs.delete(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const { timerState } = await getStorageData(['timerState']);
    if (timerState?.isActive) {
      try {
        await forceReInjectOverlays();
      } catch (err) {
        console.error(`Failed to handle tab update for ${tabId}:`, err);
      }
    }
  }
});

chrome.tabs.onActivated.addListener(async () => {
  refreshActivity();
  const { timerState } = await getStorageData(['timerState']);
  if (timerState?.isActive) {
    try {
      await forceReInjectOverlays();
    } catch (err) {
      console.error('[Background] Failed to handle tab activation:', err);
    }
  }
});

// Auto-reset if idle for 5+ minutes and timer is not actively counting
setInterval(async () => {
  const now = Date.now();
  const diff = now - lastActivity;
  const fiveMinutes = 5 * 60_000;
  const { timerState } = await getStorageData(['timerState']);
  
  if (diff > fiveMinutes) {
    if (!timerState?.isActive || timerState.isPaused) {
      await resetTimer();
      console.log('[Background] Auto-reset after idle');
    }
  }
}, 30_000);

function refreshActivity(): void {
  lastActivity = Date.now();
}

//
// Force re-inject content script into all eligible tabs so that
// the black widget can show up (or update).
//
async function forceReInjectOverlays(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const { timerState } = await getStorageData(['timerState']);

  for (const tab of tabs) {
    if (!tab.id || !/^https?:\/\//.test(tab.url || '')) continue;
    
    try {
      // Re-inject to ensure fresh state
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js']
      });
      activeWidgetTabs.add(tab.id);

      // Send current state after re-inject
      if (timerState?.isActive) {
        await chrome.tabs.sendMessage(tab.id, {
          action: timerState.isPaused ? 'timerPaused' : 'timerStarted',
          timerState: timerState
        });
      } else {
        // Even if not active, we might want to broadcast "timerReset" 
        // so that widget shows "No timer running" if it's been injected.
        await chrome.tabs.sendMessage(tab.id, {
          action: 'timerReset',
          timerState: defaultTimerState
        });
      }
    } catch (err) {
      console.error(`Failed to handle tab ${tab.id}:`, err);
    }
  }
}

//
// Listen for messages from popup or content script
//
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    refreshActivity();
    const data: Partial<StorageData> = await getStorageData(['timerState']);
    const ts: TimerState = data.timerState || defaultTimerState;

    switch (message.action) {
      case 'globalRestart':
        restartTimer()
          .then(() => {
            sendResponse({ status: 'Timer restarted globally' });
          })
          .catch((err) => {
            sendResponse({ status: 'error', error: err.toString() });
          });
        break;

      case 'startTimer':
        await startTimer(message.interval, message.mode);
        sendResponse({ status: 'Timer started' });
        break;

      case 'resumeTimer':
        await resumeTimer(ts);
        sendResponse({ status: 'Timer resumed' });
        break;

      case 'pauseTimer':
        {
          const paused = await pauseTimer(ts);
          await notifyAllTabs({ action: 'timerPaused', timerState: paused });
          sendResponse({ status: 'Timer paused' });
        }
        break;

      case 'resetTimer':
        await resetTimer();
        await notifyAllTabs({ action: 'timerReset', timerState: defaultTimerState });
        await forceReInjectOverlays();
        sendResponse({ status: 'Timer reset' });
        break;

      case 'snoozeTimer':
        await snoozeTimer();
        await forceReInjectOverlays();
        sendResponse({ status: 'Timer snoozed' });
        break;

      case 'closeOverlay':
        // If you want to end the timer as well, call resetTimer().
        // Or if you want to keep the timer running in the background
        // but remove the widget from that tab, just do notifyAllTabs
        // with removeOverlay.
        await notifyAllTabs({ action: 'removeOverlay' });
        sendResponse({ status: 'Overlay closed globally' });
        break;

      default:
        console.warn('[Background] Unknown action:', message.action);
        sendResponse({ status: 'Unknown action' });
        break;
    }
  })();
  return true; // keep message channel open for async
});

//
// Utility to message every open tab
//
async function notifyAllTabs(payload: any): Promise<void> {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, payload);
    } catch (err) {
      console.error(`Failed to notify tab ${tab.id}:`, err);
    }
  }
}

//
// Start new timer
//
async function startTimer(interval: number, mode: TimerState['mode']): Promise<void> {
  const now = Date.now();
  const endTime = now + interval * 60_000;

  const newTimerState: TimerState = {
    isActive: true,
    isPaused: false,
    timeLeft: interval * 60,
    mode: mode,
    interval: interval,
    isBlinking: false,
    startTime: now,
    endTime: endTime
  };

  await updateTimerState(newTimerState);
  chrome.alarms.clear('mindfulnessTimer');
  chrome.alarms.create('mindfulnessTimer', { when: endTime });

  // Re-inject overlays and broadcast
  await forceReInjectOverlays();
  await notifyAllTabs({ action: 'timerStarted', timerState: newTimerState });
}

//
// Pause
//
async function pauseTimer(ts: TimerState): Promise<TimerState> {
  if (ts.isActive && !ts.isPaused && ts.endTime) {
    const now = Date.now();
    const remaining = Math.max(0, ts.endTime - now);
    const remainingSec = Math.floor(remaining / 1000);

    chrome.alarms.clear('mindfulnessTimer');
    const updated: TimerState = {
      ...ts,
      isPaused: true,
      timeLeft: remainingSec,
      endTime: null
    };
    await updateTimerState(updated);
    return updated;
  }
  return ts;
}

//
// Resume
//
async function resumeTimer(timerState: TimerState): Promise<void> {
  if (timerState.isActive && timerState.isPaused && timerState.timeLeft > 0) {
    const now = Date.now();
    const newEndTime = now + timerState.timeLeft * 1000;

    const updatedTimerState: TimerState = {
      ...timerState,
      isPaused: false,
      startTime: now,
      endTime: newEndTime
    };

    await updateTimerState(updatedTimerState);
    chrome.alarms.clear('mindfulnessTimer');
    chrome.alarms.create('mindfulnessTimer', { when: newEndTime });

    await forceReInjectOverlays();
    await notifyAllTabs({
      action: 'timerResumed',
      timerState: updatedTimerState
    });
  }
}

//
// Reset
//
async function resetTimer(): Promise<void> {
  await updateTimerState(defaultTimerState);
  chrome.alarms.clear('mindfulnessTimer');
  await forceReInjectOverlays();
}

//
// Restart
//
async function restartTimer(): Promise<void> {
  await resetTimer();
  const data = await getStorageData(['interval', 'timerMode']);
  const interval = data.interval ?? defaultAppSettings.interval;
  const mode = data.timerMode ?? defaultAppSettings.timerMode;

  await startTimer(interval, mode);
  await forceReInjectOverlays();
}

//
// Snooze for 5 minutes
//
async function snoozeTimer(): Promise<void> {
  const now = Date.now();
  const endTime = now + 5 * 60_000;
  const newTS: TimerState = {
    ...defaultTimerState,
    isActive: true,
    timeLeft: 5 * 60,
    mode: 'shortBreak',
    interval: 5,
    startTime: now,
    endTime: endTime
  };
  await updateTimerState(newTS);
  chrome.alarms.clear('mindfulnessTimer');
  chrome.alarms.create('mindfulnessTimer', { when: endTime });

  await forceReInjectOverlays();
  await notifyAllTabs({
    action: 'timerStarted',
    timerState: newTS
  });
}

//
// Helper: set the timerState & notify content scripts that it changed
// so the black widget can refresh even if no "start/resume/pause" action
// was triggered.
//
async function updateTimerState(newState: TimerState) {
  await setStorageData({ timerState: newState });
  await notifyAllTabs({ action: 'timerUpdated', timerState: newState });
}

//
// Alarm triggers => timer done => broadcast 'timerCompleted'
//
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'mindfulnessTimer') {
    const { soundEnabled, selectedSound, timerState, showQuotes } = await getStorageData([
      'soundEnabled',
      'selectedSound',
      'timerState',
      'showQuotes'
    ]);
    const ts: TimerState = timerState || defaultTimerState;

    if (ts.isActive && !ts.isPaused) {
      await resetTimer();

      let quote: string | null = null;
      if (showQuotes) {
        quote = pickRandomQuote();
      }

      let soundUrl: string | null = null;
      if (soundEnabled && selectedSound) {
        soundUrl = chrome.runtime.getURL(`sounds/${selectedSound}.mp3`);
      }

      const windows = await chrome.windows.getAll({ populate: true });
      const activeTabs: chrome.tabs.Tab[] = [];
      windows.forEach((window) => {
        window.tabs?.forEach((tab) => {
          if (tab.active) activeTabs.push(tab);
        });
      });

      const allTabs = await chrome.tabs.query({});
      for (const tab of allTabs) {
        if (!tab.id) continue;
        const isActive = activeTabs.some((activeTab) => activeTab.id === tab.id);
        try {
          await sendMessageToTab(tab.id, {
            action: 'timerCompleted',
            quote,
            soundUrl,
            isActive
          });
        } catch (err) {
          console.error(`Failed to send timerCompleted to tab ${tab.id}:`, err);
        }
      }
    }
  }
});

function pickRandomQuote(): string {
  const quotes: string[] = [
    "Be mindful in the moment.",
    "Focus on what matters now.",
    "Take a breath and refocus.",
    "Small steps lead to big results."
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function sendMessageToTab(tabId: number, message: any): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, () => {
      const lastErr = chrome.runtime.lastError;
      if (lastErr) {
        console.error(`Error sending message to tab ${tabId}:`, lastErr);
        reject(lastErr);
      } else {
        resolve();
      }
    });
  });
}
