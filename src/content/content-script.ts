// src/content/content-script.ts

/// <reference types="chrome"/>
import { TimerState } from '../types/app';

// We use an IIFE to avoid polluting the global scope
(() => {
  console.log('[Mindful Timer] Content script loaded.');

    // If this overlay already exists, don’t recreate it
  if (document.getElementById('mindful-timer-overlay')) {
    console.log('[Mindful Timer] Overlay already present. Skipping creation.');
    return;
  }

  // Local state
  let intervalId: ReturnType<typeof setInterval> | undefined;
  let isCompleted = false;  // Tracks whether session is complete

  // Create the container (black overlay at bottom-right)
  const container = document.createElement('div');
  container.id = 'mindful-timer-overlay';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.width = '150px';
  container.style.background = 'rgba(0,0,0,0.7)';
  container.style.color = '#fff';
  container.style.borderRadius = '8px';
  container.style.padding = '10px';
  container.style.zIndex = '999999'; // Very high so it’s above most page elements
  container.style.fontFamily = 'sans-serif';
  container.style.userSelect = 'none';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'flex-start';

  // Time display
  const timeDisplay = document.createElement('div');
  timeDisplay.style.fontSize = '18px';
  timeDisplay.style.fontWeight = 'bold';
  timeDisplay.style.marginBottom = '5px';
  container.appendChild(timeDisplay);

  // Close button (top-right “X”)
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '5px';
  closeBtn.style.right = '8px';
  closeBtn.style.color = '#fff';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '16px';
  container.appendChild(closeBtn);

  // Pause/Resume/Restart button
  const actionButton = document.createElement('button');
  actionButton.style.cursor = 'pointer';
  actionButton.style.fontSize = '14px';
  actionButton.style.padding = '6px 10px';
  actionButton.style.marginTop = '5px';
  actionButton.style.color = '#333';
  actionButton.style.background = '#ccc';
  actionButton.style.border = '1px solid #666';
  actionButton.style.borderRadius = '4px';
  actionButton.textContent = 'Pause'; // Default text
  container.appendChild(actionButton);

  // Insert into DOM
  document.body.appendChild(container);

  // -------------------------------
  //   EVENT LISTENERS
  // -------------------------------

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.timerState) {
      console.log('[Mindful Timer] Timer state changed:', changes.timerState);
      const newState = changes.timerState.newValue;
      
      // If timer is now active, ensure we're showing correctly
      if (newState?.isActive) {
        isCompleted = false;
        actionButton.textContent = newState.isPaused ? 'Resume' : 'Pause';
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(updateTimerDisplay, 1000);
        updateTimerDisplay();
      } else if (!newState?.isActive) {
        // Timer is not active
        timeDisplay.textContent = 'No timer running';
        actionButton.textContent = 'Restart';
      }
    }
});
  
  // 1) Close button => remove overlay + tell background to globally kill
  closeBtn.addEventListener('click', () => {
    console.log('[Mindful Timer] Close button clicked => remove overlay');
    container.remove();
    if (intervalId) clearInterval(intervalId);
    chrome.runtime.sendMessage({ action: 'closeOverlay' });
  });

  // 2) Action button => Pause/Resume or Restart
  actionButton.addEventListener('click', () => {
    // If session completed => "Restart"
    if (isCompleted) {
      console.log('[Mindful Timer] “Restart” clicked => sending globalRestart');
      chrome.runtime.sendMessage({ action: 'globalRestart' });
      // Clear completed state, set button to “Pause”
      isCompleted = false;
      actionButton.textContent = 'Pause';
      removeQuote();
      return;
    }

    // If session not completed => Pause or Resume or Start fresh
    chrome.storage.sync.get('timerState', (res: any) => {
      const ts: TimerState = res.timerState;
      // If no timer running => globalRestart
      if (!ts || !ts.isActive) {
        console.log('[Mindful Timer] No timer => globalRestart');
        chrome.runtime.sendMessage({ action: 'globalRestart' });
        return;
      }

      // Timer is active => pause or resume
      if (!ts.isPaused) {
        // Pause
        console.log('[Mindful Timer] Pausing the timer');
        chrome.runtime.sendMessage({ action: 'pauseTimer' });
        actionButton.textContent = 'Resume';
      } else {
        // Resume
        console.log('[Mindful Timer] Resuming the timer');
        chrome.runtime.sendMessage({ action: 'resumeTimer' });
        actionButton.textContent = 'Pause';
      }
    });
  });

  // 3) Listen for messages from background/popup
  chrome.runtime.onMessage.addListener((msg: any, sender, sendResponse) => {

    switch (msg.action) {
  case 'timerUpdated':
     // Forcibly refresh display,
   console.log('[Mindful Timer] Received timerUpdated => forcing UI refresh');
  if (intervalId) clearInterval(intervalId);
   intervalId = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
    sendResponse({ ack: true });
  break;
      case 'removeOverlay':
        // We’re told to remove ourselves from the DOM
        container.remove();
        if (intervalId) clearInterval(intervalId);
        sendResponse({ ack: true });
        break;

      case 'timerCompleted':
        // The background says time is up => show “Session Complete!” + optional quote + sound
        isCompleted = true;
        timeDisplay.textContent = 'Session Complete!';
        if (msg.isActive && msg.soundUrl) {
          playCompletionSound(msg.soundUrl);
        }
        if (msg.quote) {
          showQuoteInOverlay(msg.quote);
        }
        actionButton.textContent = 'Restart';
        sendResponse({ ack: true });
        break;

       case 'timerStarted':
    isCompleted = false;
    actionButton.textContent = 'Pause';
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();
    sendResponse({ ack: true });
    break;

      case 'timerPaused':
        // The timer is paused
        isCompleted = false;
        actionButton.textContent = 'Resume';
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(updateTimerDisplay, 1000);
        updateTimerDisplay();
        sendResponse({ ack: true });
        break;

      case 'timerResumed':
        // The timer is resumed
        isCompleted = false;
        actionButton.textContent = 'Pause';
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(updateTimerDisplay, 1000);
        updateTimerDisplay();
        sendResponse({ ack: true });
        break;

      case 'timerReset':
        // The timer is reset => no timer running
        isCompleted = false;
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(updateTimerDisplay, 1000);
        timeDisplay.textContent = 'No timer running';
        actionButton.textContent = 'Restart';
        sendResponse({ ack: true });
        break;

      default:
        break;
    }

    return true; // Keep the message channel open for async
  });

  // -------------------------------
  //   Update the displayed time
  // -------------------------------
  function updateTimerDisplay(): void {
    if (isCompleted) return;

    chrome.storage.sync.get('timerState', (res: any) => {
      const ts: TimerState = res.timerState;
      if (ts && ts.isActive) {
        if (ts.isPaused) {
          // Timer paused => show leftover
          timeDisplay.textContent = formatTime(ts.timeLeft);
          actionButton.textContent = 'Resume';
        } else if (ts.endTime) {
          // Timer is running => compute how much is left
          const now = Date.now();
          const remainingMs = ts.endTime - now;
          const newTimeLeft = Math.max(0, Math.floor(remainingMs / 1000));
          timeDisplay.textContent = formatTime(newTimeLeft);
          actionButton.textContent = 'Pause';
        }
        // If we were in “completed” mode, revert
        isCompleted = false;
        removeQuote();
      } else {
        // No timer => show “No timer running”
        timeDisplay.textContent = 'No timer running';
        actionButton.textContent = 'Restart';
      }
    });
  }

  // -------------------------------
  //   Helper for mm:ss
  // -------------------------------
  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // -------------------------------
  //   Play completion sound
  // -------------------------------
  function playCompletionSound(soundUrl: string): void {
    const audio = new Audio(soundUrl);
    chrome.storage.sync.get('soundVolume', (res: any) => {
      const volume = res.soundVolume !== undefined ? res.soundVolume / 100 : 1.0;
      audio.volume = volume;
      audio.play().catch(err => {
        console.error('[Mindful Timer] Audio playback failed:', err);
      });
    });
  }

  // -------------------------------
  //   Show / remove quote
  // -------------------------------
  function showQuoteInOverlay(quote: string) {
    const quoteEl = document.createElement('div');
    quoteEl.className = 'quote-text';
    quoteEl.style.marginTop = '5px';
    quoteEl.style.color = '#fff';
    quoteEl.style.fontSize = '12px';
    quoteEl.textContent = `“${quote}”`;
    container.appendChild(quoteEl);
  }

  function removeQuote() {
    const existing = container.querySelector('.quote-text');
    if (existing) existing.remove();
  }

  // Kick off an update loop
  intervalId = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
})();
