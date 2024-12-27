// src/background/background.ts

/// <reference types="chrome"/>

import { getStorageData, setStorageData } from '../utils/storage';
import { TimerState, StorageData } from '../types/app';

let lastActivity: number = Date.now();

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

// On install, set some defaults
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

/**
 * A) Inject content script on tab updates if extensionClosed === false
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const { extensionClosed } = await getStorageData(['extensionClosed']);
    if (!extensionClosed) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content-script.js']
        });
        console.log(`[Background] Injected content-script.js into tab ${tabId}`);
      } catch (err) {
        console.error(`Failed to inject content script into tab ${tabId}:`, err);
      }
    }
  }
});

/**
 * B) Inject content script on tab switch if extensionClosed === false
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  refreshActivity();
  const { extensionClosed } = await getStorageData(['extensionClosed']);
  if (!extensionClosed) {
    const tabId = activeInfo.tabId;
    chrome.tabs.get(tabId, async (t) => {
      if (t && /^https?:\/\//.test(t.url ?? '')) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content-script.js']
          });
          console.log(`[Background] Injected content-script.js into tab ${tabId}`);
        } catch (err) {
          console.error(`Failed to inject content script into tab ${tabId}:`, err);
        }
      }
    });
  }
});

/**
 * C) Optional idle reset after 5 min
 */
setInterval(async () => {
  const now = Date.now();
  const diff = now - lastActivity;
  const fiveMinutes = 5 * 60_000;

  const { extensionClosed, timerState } = await getStorageData(['extensionClosed','timerState']);
  if (!extensionClosed && diff > fiveMinutes) {
    if (!timerState?.isActive || timerState.isPaused) { // Optional chaining for timerState
      await resetTimer();
      console.log('[Background] Auto-reset after idle');
    }
  }
}, 30_000);

function refreshActivity(): void {
  lastActivity = Date.now();
}

/**
 * D) Listen for messages
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    refreshActivity();

    const data: Partial<StorageData> = await getStorageData(['extensionClosed','timerState']);
    let extensionClosed: boolean = data.extensionClosed ?? false;
    const ts: TimerState = data.timerState || defaultTimerState;

    switch (message.action) {
      case 'startTimer':
      case 'resumeTimer':
        // Reopen extension if it was closed
        if (extensionClosed) {
          await setStorageData({ extensionClosed: false });
          extensionClosed = false;
          await injectOverlayInAllTabs();
          console.log('[Background] Auto-reopened extension on Start/Resume');
        }

        if (message.action === 'startTimer') {
          await startTimer(message.interval, message.mode);
          sendResponse({ status: 'Timer started' });
          console.log('[Background] Timer started.');
        } else {
          await resumeTimer(ts);
          sendResponse({ status: 'Timer resumed' });
          console.log('[Background] Timer resumed.');
        }
        break;

      case 'pauseTimer':
        await pauseTimer(ts);
        sendResponse({ status: 'Timer paused' });
        console.log('[Background] Timer paused.');
        break;

      case 'resetTimer':
        await resetTimer();
        sendResponse({ status: 'Timer reset' });
        console.log('[Background] Timer reset.');
        break;

      case 'snoozeTimer':
        await snoozeTimer();
        sendResponse({ status: 'Timer snoozed' });
        console.log('[Background] Timer snoozed.');
        break;

      case 'closeOverlay':
        // Kill timer
        await resetTimer();
        // Mark extensionClosed
        await setStorageData({ extensionClosed: true });
        // Remove overlay in all tabs
        await notifyAllTabs({ action: 'removeOverlay' });
        console.log('[Background] Overlay closed globally.');
        sendResponse({ status: 'Overlay closed globally' });
        break;

      default:
        console.warn('[Background] Received unknown action:', message.action);
        sendResponse({ status: 'Unknown action' });
        break;
    }
  })();
  return true;
});

/**
 * E) Timer logic
 */
async function startTimer(intervalMin: number, mode: string): Promise<void> {
  const now = Date.now();
  const endTime = now + intervalMin * 60_000;
  const newTS: TimerState = {
    isActive: true,
    isPaused: false,
    timeLeft: intervalMin * 60,
    mode: mode as any, // Consider refining the type if possible
    interval: intervalMin,
    isBlinking: false,
    startTime: now,
    endTime: endTime
  };
  await setStorageData({ timerState: newTS });
  chrome.alarms.clear('mindfulnessTimer');
  chrome.alarms.create('mindfulnessTimer', { when: endTime });
  console.log(`[Background] Timer started for ${intervalMin} minutes.`);
}

async function pauseTimer(ts: TimerState): Promise<void> {
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
    console.log('[Background] Timer paused.');
  }
}

async function resumeTimer(ts: TimerState): Promise<void> {
  if (ts.isActive && ts.isPaused && ts.timeLeft > 0) {
    const now = Date.now();
    const newEndTime = now + ts.timeLeft * 1000;
    const updated: TimerState = {
      ...ts,
      isPaused: false,
      endTime: newEndTime,
      startTime: now
    };
    await setStorageData({ timerState: updated });

    chrome.alarms.clear('mindfulnessTimer');
    chrome.alarms.create('mindfulnessTimer', { when: newEndTime });
    console.log('[Background] Timer resumed.');
  }
}

async function resetTimer(): Promise<void> {
  await setStorageData({ timerState: defaultTimerState });
  chrome.alarms.clear('mindfulnessTimer');
  console.log('[Background] Timer reset.');
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
  console.log('[Background] Timer snoozed for 5 minutes.');
}

/**
 * F) Alarm => if it's still running at alarm time, mark completed
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'mindfulnessTimer') {
    const { soundEnabled, selectedSound, timerState, showQuotes } = await getStorageData(
      ['soundEnabled', 'selectedSound', 'timerState', 'showQuotes']
    );
    const ts: TimerState = timerState || defaultTimerState;
    if (ts.isActive && !ts.isPaused) {
      // Mark completed
      await resetTimer();

      // If user wants quotes, pick one
      let quote: string | null = null;
      if (showQuotes) {
        quote = pickRandomQuote();
      }

      // Retrieve the sound file URL
      let soundUrl: string | null = null;
      if (soundEnabled && selectedSound) {
        soundUrl = chrome.runtime.getURL(`sounds/${selectedSound}.mp3`);
      }

      // Broadcast the completed status + optional quote and sound URL to all tabs
      const allTabs: chrome.tabs.Tab[] = await chrome.tabs.query({});
      const activeTabs: chrome.tabs.Tab[] = [];

      const windows: chrome.windows.Window[] = await chrome.windows.getAll({ populate: true });
      windows.forEach((window: chrome.windows.Window) => {
        window.tabs?.forEach((tab: chrome.tabs.Tab) => { // Optional chaining added here
          if (tab.active) {
            activeTabs.push(tab);
          }
        });
      });

      for (const tab of allTabs) {
        if (tab.id === undefined) continue; // Ensure tab.id exists
        const isActive: boolean = activeTabs.some(activeTab => activeTab.id === tab.id);
        try {
          await sendMessageToTab(tab.id, { action: 'timerCompleted', quote, soundUrl, isActive });
          console.log(`[Background] Sent timerCompleted to tab ${tab.id}`);
        } catch (err) {
          console.error(`Failed to send timerCompleted to tab ${tab.id}:`, err);
        }
      }
    }
  }
});

/** 
 * G) Simple helper to pick a random quote 
 * (Replace with real logic or quote API if desired)
 */
function pickRandomQuote(): string {
  const quotes: string[] = [
    "Be mindful in the moment.",
    "Focus on what matters now.",
    "Take a breath and refocus.",
    "Small steps lead to big results."
  ];
  const index: number = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

/**
 * I) Remove overlays or re-inject them
 */
async function notifyAllTabs(payload: any): Promise<void> {
  const allTabs: chrome.tabs.Tab[] = await chrome.tabs.query({});
  for (const tab of allTabs) {
    if (tab.id === undefined) continue;
    try {
      await sendMessageToTab(tab.id, payload);
      console.log(`[Background] Sent message to tab ${tab.id}:`, payload);
    } catch (err) {
      console.error(`Failed to send message to tab ${tab.id}:`, err);
    }
  }
}

async function injectOverlayInAllTabs(): Promise<void> {
  const allTabs: chrome.tabs.Tab[] = await chrome.tabs.query({});
  for (const tab of allTabs) {
    if (tab.id === undefined || !/^https?:\/\//.test(tab.url ?? '')) continue;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js']
      });
      console.log(`[Background] Injected content-script.js into tab ${tab.id}`);
    } catch (err) {
      console.error(`Failed to inject content script into tab ${tab.id}:`, err);
    }
  }
}

/**
 * Helper function to send messages to tabs using Promises
 */
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