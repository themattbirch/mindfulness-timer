/// <reference types="chrome"/>
import { getStorageData, setStorageData } from '../utils/storage';
import { TimerState, StorageData } from '../types/app';
import { AppSettings } from '../types/app';

let countdownInterval: ReturnType<typeof setInterval> | null = null;
let lastActivity: number = Date.now();

// Track tabs that have the overlay in case we want to skip unnecessary injections
const activeWidgetTabs = new Set<number>();

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
    url: 'index.html',
    type: 'popup',
    width: 400,
    height: 600,
    focused: true,
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  activeWidgetTabs.delete(tabId);
});

/**
 * - If a page is refreshed (status==='complete'), and the timer is active,
 *   forcibly re-inject the overlay (skipIfAlreadyInjected=false).
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const { timerState } = await getStorageData(['timerState']);
    // If there's an active timer, forcibly re-inject to keep everything in sync
    if (timerState?.isActive) {
      try {
        await forceReInjectOverlays(false, [tabId]);
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
      // If you only want to re-inject if needed, you can pass (true) and skip already injected.
      // But if you truly want to ensure the tab is up to date, pass (false).
      await forceReInjectOverlays(true);
    } catch (err) {
      console.error('[Background] Failed to handle tab activation:', err);
    }
  }
});

setInterval(async () => {
  const now = Date.now();
  const diff = now - lastActivity;
  const fiveMinutes = 5 * 60_000;
  const { timerState } = await getStorageData(['timerState']);
  
  if (diff > fiveMinutes) {
    // If the user is idle for 5+ minutes and the timer is paused or inactive, reset it
    if (!timerState?.isActive || timerState.isPaused) {
      await resetTimer();
      console.log('[Background] Auto-reset after idle');
    }
  }
}, 30_000);

function refreshActivity() {
  lastActivity = Date.now();
}

/**
 * - skipIfAlreadyInjected => if true, skip tabs that are already in activeWidgetTabs.
 */

 function isValidTab(t: chrome.tabs.Tab | null): t is chrome.tabs.Tab {
  return !!t && !!t.id && /^https?:\/\//.test(t.url || '');
}
async function forceReInjectOverlays(
  skipIfAlreadyInjected = true,
  specificTabIds?: number[]
) {
  // Retrieve the current timer state from storage
  const { timerState } = await getStorageData(['timerState']);
  let tabs: chrome.tabs.Tab[] = [];

  if (specificTabIds && specificTabIds.length > 0) {
    // Only re-inject on the specified tab IDs
    const fetchedTabs = await Promise.all(
      specificTabIds.map((id) => chrome.tabs.get(id).catch(() => null))
    );

    // Use the type guard to filter out invalid tabs
    tabs = fetchedTabs.filter(isValidTab);
  } else {
    // Re-inject on all possible tabs
    const queriedTabs = await chrome.tabs.query({});
    
    // Use an inline type guard in the filter
    tabs = queriedTabs.filter(
      (t): t is chrome.tabs.Tab => !!t.id && /^https?:\/\//.test(t.url || '')
    );
  }

  // Proceed only if there are valid tabs to inject
  if (tabs.length === 0) {
    console.log("[Background] No valid tabs found for injection.");
    return;
  }

  for (const tab of tabs) {
    if (!tab.id) continue;

    // If skipping already-injected tabs, skip them
    if (skipIfAlreadyInjected && activeWidgetTabs.has(tab.id)) {
      continue;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js'],
      });
      activeWidgetTabs.add(tab.id);

      // Immediately send the current state so the overlay shows updated info
      if (timerState?.isActive) {
        await chrome.tabs.sendMessage(tab.id, {
          action: timerState.isPaused ? 'timerPaused' : 'timerStarted',
          timerState: timerState,
        });
      } else {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'timerReset',
          timerState: defaultTimerState,
        });
      }
    } catch (err) {
      console.error(`Failed to inject overlay on tab ${tab.id}:`, err);
    }
  }
}

async function removeOverlayFromTab(tabId: number) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'removeOverlay' });
    activeWidgetTabs.delete(tabId);
  } catch (err) {
    console.error(`[Background] Could not remove overlay from tab ${tabId}`, err);
  }
}

async function notifyAllTabs(payload: any) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, payload);
    } catch {
      // ignore if content script wasn't injected
    }
  }
}

// ──────────────────────────────────────────────────────
//  MESSAGE HANDLER
// ──────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    refreshActivity();
    const { timerState } = await getStorageData(['timerState']);
    const ts: TimerState = timerState || defaultTimerState;

    switch (message.action) {
      case 'killTimer':
        await killTimerGlobally();
        sendResponse({ status: 'Timer killed!' });
        break;

      case 'globalRestart':
        await restartTimer();
        sendResponse({ status: 'Timer restarted globally' });
        break;

      case 'startTimer':
        await startTimer(message.interval, message.mode);
        sendResponse({ status: 'Timer started' });
        break;

      case 'resumeTimer':
        await resumeTimer(ts);
        sendResponse({ status: 'Timer resumed' });
        break;

      case 'pauseTimer': {
        const paused = await pauseTimer(ts);
        await notifyAllTabs({ action: 'timerPaused', timerState: paused });
        sendResponse({ status: 'Timer paused' });
        break;
      }

      case 'resetTimer':
        await resetTimer();
        await notifyAllTabs({ action: 'timerReset', timerState: defaultTimerState });
        // Not forcibly re-injecting because the timer is now inactive
        sendResponse({ status: 'Timer reset' });
        break;

      case 'snoozeTimer':
        await snoozeTimer();
        sendResponse({ status: 'Timer snoozed' });
        break;

      case 'closeOverlay':
        if (sender.tab?.id != null) {
          await removeOverlayFromTab(sender.tab.id);
        }
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

// ──────────────────────────────────────────────────────
//  KILL TIMER => Remove from all tabs
// ──────────────────────────────────────────────────────
async function killTimerGlobally() {
  await resetTimer();

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'removeOverlay' });
    } catch {}
  }
  activeWidgetTabs.clear();
}

async function startTimer(interval: number, mode: TimerState['mode']) {
  const now = Date.now();
  const endTime = now + interval * 60_000;

  const newTimerState: TimerState = {
    isActive: true,
    isPaused: false,
    timeLeft: interval * 60,
    mode,
    interval,
    isBlinking: false,
    startTime: now,
    endTime,
  };

  await updateTimerState(newTimerState);
  chrome.alarms.clear('mindfulnessTimer');
  chrome.alarms.create('mindfulnessTimer', { when: endTime });

  startCountdownInterval();

  // Force re-inject on all tabs => fix old tabs
  await forceReInjectOverlays(false);

  await notifyAllTabs({ action: 'timerStarted', timerState: newTimerState });
}

function startCountdownInterval() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(async () => {
    const { timerState } = await getStorageData(['timerState']);
    if (!timerState || !timerState.isActive || timerState.isPaused || !timerState.endTime) {
      clearInterval(countdownInterval!);
      countdownInterval = null;
      return;
    }
    const now = Date.now();
    const diffMs = timerState.endTime - now;
    let newTimeLeft = Math.floor(diffMs / 1000);
    if (newTimeLeft < 0) newTimeLeft = 0;

    if (newTimeLeft <= 0) {
      clearInterval(countdownInterval!);
      countdownInterval = null;
      return;
    }

    const updatedTS: TimerState = {
      ...timerState,
      timeLeft: newTimeLeft,
    };
    await updateTimerState(updatedTS);
  }, 1000);
}

async function resumeTimer(ts: TimerState) {
  if (ts.isActive && ts.isPaused && ts.timeLeft > 0) {
    const now = Date.now();
    const newEndTime = now + ts.timeLeft * 1000;

    const updatedTimerState: TimerState = {
      ...ts,
      isPaused: false,
      startTime: now,
      endTime: newEndTime,
    };

    await updateTimerState(updatedTimerState);
    chrome.alarms.clear('mindfulnessTimer');
    chrome.alarms.create('mindfulnessTimer', { when: newEndTime });

    startCountdownInterval();

    // Force re-inject => old pages will see “Resumed” state
    await forceReInjectOverlays(false);

    await notifyAllTabs({ action: 'timerResumed', timerState: updatedTimerState });
  }
}

async function pauseTimer(ts: TimerState): Promise<TimerState> {
  if (ts.isActive && !ts.isPaused && ts.endTime) {
    const now = Date.now();
    const remaining = Math.max(0, ts.endTime - now);
    const remainingSec = Math.floor(remaining / 1000);

    chrome.alarms.clear('mindfulnessTimer');
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    const updated: TimerState = {
      ...ts,
      isPaused: true,
      timeLeft: remainingSec,
      endTime: null,
    };
    await updateTimerState(updated);
    return updated;
  }
  return ts;
}

async function restartTimer() {
  await resetTimer();
  const data = await getStorageData(['interval', 'timerMode']);
  const interval = data.interval ?? defaultAppSettings.interval;
  const mode = data.timerMode ?? defaultAppSettings.timerMode;

  await startTimer(interval, mode);

  // Force re-inject => old pages see “Restarted” state
  await forceReInjectOverlays(false);
}

async function snoozeTimer() {
  const now = Date.now();
  const endTime = now + 5 * 60_000;
  const newTS: TimerState = {
    ...defaultTimerState,
    isActive: true,
    timeLeft: 5 * 60,
    mode: 'shortBreak',
    interval: 5,
    startTime: now,
    endTime,
  };

  await updateTimerState(newTS);
  chrome.alarms.clear('mindfulnessTimer');
  chrome.alarms.create('mindfulnessTimer', { when: endTime });

  startCountdownInterval();

  // Force re-inject => old pages see short break
  await forceReInjectOverlays(false);

  await notifyAllTabs({ action: 'timerStarted', timerState: newTS });
}

async function resetTimer() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  await updateTimerState(defaultTimerState);
  chrome.alarms.clear('mindfulnessTimer');
  activeWidgetTabs.clear();
}

async function updateTimerState(newState: TimerState) {
  await setStorageData({ timerState: newState });
  await notifyAllTabs({ action: 'timerUpdated', timerState: newState });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'mindfulnessTimer') {
    const { soundEnabled, selectedSound, timerState, showQuotes } = await getStorageData([
      'soundEnabled',
      'selectedSound',
      'timerState',
      'showQuotes',
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

      // Broadcast completion to all tabs
      const windows = await chrome.windows.getAll({ populate: true });
      const activeTabs: chrome.tabs.Tab[] = [];
      windows.forEach((window) => {
        window.tabs?.forEach((t) => {
          if (t.active) activeTabs.push(t);
        });
      });

      const allTabs = await chrome.tabs.query({});
      for (const tab of allTabs) {
        if (!tab.id) continue;
        const isActive = activeTabs.some((x) => x.id === tab.id);
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'timerCompleted',
            quote,
            soundUrl,
            isActive,
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
    'Be mindful in the moment.',
    'Focus on what matters now.',
    'Take a breath and refocus.',
    'Small steps lead to big results.',
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}
