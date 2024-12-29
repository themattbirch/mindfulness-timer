// src/background/background.ts

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
    extensionClosed: false,
    timerState: defaultTimerState
  });
  console.log('[Background] Extension installed and default settings set.');
});

chrome.tabs.onRemoved.addListener((tabId) => {
  activeWidgetTabs.delete(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const { extensionClosed, timerState } = await getStorageData(['extensionClosed', 'timerState']);
    if (!extensionClosed || timerState?.isActive) {
      try {
        await forceReInjectOverlays();
      } catch (err) {
        console.error(`Failed to handle tab update for ${tabId}:`, err);
      }
    }
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  refreshActivity();
  const { extensionClosed, timerState } = await getStorageData(['extensionClosed', 'timerState']);
  if (!extensionClosed || timerState?.isActive) {
    try {
      await forceReInjectOverlays();
    } catch (err) {
      console.error(`Failed to handle tab activation:`, err);
    }
  }
});

setInterval(async () => {
  const now = Date.now();
  const diff = now - lastActivity;
  const fiveMinutes = 5 * 60_000;

  const { extensionClosed, timerState } = await getStorageData(['extensionClosed','timerState']);
  if (!extensionClosed && diff > fiveMinutes) {
    if (!timerState?.isActive || timerState.isPaused) {
      await resetTimer();
      console.log('[Background] Auto-reset after idle');
    }
  }
}, 30_000);

function refreshActivity(): void {
  lastActivity = Date.now();
}

async function forceReInjectOverlays(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const currentState = await getStorageData(['timerState']);
  
  for (const tab of tabs) {
    if (!tab.id || !/^https?:\/\//.test(tab.url || '')) continue;
    
    try {
      // Always re-inject to ensure fresh state
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js']
      });
      activeWidgetTabs.add(tab.id);
      
      // Then send current state
      if (currentState.timerState?.isActive) {
        await chrome.tabs.sendMessage(tab.id, {
          action: currentState.timerState.isPaused ? 'timerPaused' : 'timerStarted',
          timerState: currentState.timerState
        });
      }
    } catch (err) {
      console.error(`Failed to handle tab ${tab.id}:`, err);
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    refreshActivity();

    const data: Partial<StorageData> = await getStorageData(['extensionClosed','timerState']);
    let extensionClosed: boolean = data.extensionClosed ?? false;
    const ts: TimerState = data.timerState || defaultTimerState;

    switch (message.action) {
      case 'globalRestart':
        try {
          await restartTimer();
          await forceReInjectOverlays();
          sendResponse({ status: 'Timer restarted globally' });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          console.error('[Background] globalRestart failed:', err);
          sendResponse({ status: 'error', error: errorMessage });
        }
        break;
        
      case 'startTimer':
      case 'resumeTimer':
        if (extensionClosed) {
          await setStorageData({ extensionClosed: false });
          extensionClosed = false;
          await forceReInjectOverlays();
        }

        if (message.action === 'startTimer') {
          await startTimer(message.interval, message.mode);
          sendResponse({ status: 'Timer started' });
        } else {
          await resumeTimer(ts);
          sendResponse({ status: 'Timer resumed' });
        }
        break;

      case 'pauseTimer':
        const paused = await pauseTimer(ts);
        await notifyAllTabs({ action: 'timerPaused', timerState: paused });
        sendResponse({ status: 'Timer paused' });
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
        await resetTimer();
        await setStorageData({ extensionClosed: true });
        await notifyAllTabs({ action: 'removeOverlay' });
        sendResponse({ status: 'Overlay closed globally' });
        break;

      default:
        console.warn('[Background] Unknown action:', message.action);
        sendResponse({ status: 'Unknown action' });
        break;
    }
  })();
  return true;
});

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

async function startTimer(interval: number, mode: TimerState['mode']): Promise<void> {
  const now = Date.now();
  const endTime = now + interval * 60 * 1000;

  const newTimerState: TimerState = {
    isActive: true,
    isPaused: false,
    timeLeft: interval * 60,
    mode: mode,
    interval: interval,
    isBlinking: false,
    startTime: now,
    endTime: endTime,
  };

  await setStorageData({ timerState: newTimerState });
  chrome.alarms.clear('mindfulnessTimer');
  chrome.alarms.create('mindfulnessTimer', { when: endTime });
  
  await forceReInjectOverlays();
  await notifyAllTabs({
    action: 'timerStarted',
    timerState: newTimerState
  });
}

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
    await setStorageData({ timerState: updated });
    return updated;
  }
  return ts;
}

async function resumeTimer(timerState: TimerState): Promise<void> {
  if (timerState.isActive && timerState.isPaused && timerState.timeLeft > 0) {
    const now = Date.now();
    const newEndTime = now + timerState.timeLeft * 1000;

    const updatedTimerState: TimerState = {
      ...timerState,
      isPaused: false,
      startTime: now,
      endTime: newEndTime,
    };

    await setStorageData({ timerState: updatedTimerState });
    chrome.alarms.clear('mindfulnessTimer');
    chrome.alarms.create('mindfulnessTimer', { when: newEndTime });

    await forceReInjectOverlays();
    await notifyAllTabs({
      action: 'timerResumed',
      timerState: updatedTimerState
    });
  }
}

async function resetTimer(): Promise<void> {
  await setStorageData({ timerState: defaultTimerState });
  chrome.alarms.clear('mindfulnessTimer');
  await forceReInjectOverlays();
}

async function restartTimer(): Promise<void> {
  await resetTimer();
  
  const data = await getStorageData(['interval', 'timerMode']);
  const interval = data.interval ?? defaultAppSettings.interval;
  const timerMode = data.timerMode ?? defaultAppSettings.timerMode;
  
  await startTimer(interval, timerMode);
  await forceReInjectOverlays();
}

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
  await setStorageData({ timerState: newTS });
  chrome.alarms.clear('mindfulnessTimer');
  chrome.alarms.create('mindfulnessTimer', { when: endTime });
  
  await forceReInjectOverlays();
  await notifyAllTabs({
    action: 'timerStarted',
    timerState: newTS
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'mindfulnessTimer') {
    const { soundEnabled, selectedSound, timerState, showQuotes } = await getStorageData(
      ['soundEnabled', 'selectedSound', 'timerState', 'showQuotes']
    );
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
      windows.forEach(window => {
        window.tabs?.forEach(tab => {
          if (tab.active) activeTabs.push(tab);
        });
      });

      const allTabs = await chrome.tabs.query({});
      for (const tab of allTabs) {
        if (!tab.id) continue;
        const isActive = activeTabs.some(activeTab => activeTab.id === tab.id);
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
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error(`Error sending message to tab ${tabId}:`, chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}