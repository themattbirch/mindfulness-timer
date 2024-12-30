/// <reference types="chrome"/>
import { TimerState } from '../types/app';

(() => {
  console.log('[Mindful Timer] Content script loaded.');

  // If overlay already exists, do not recreate
  if (document.getElementById('mindful-timer-overlay')) {
    console.log('[Mindful Timer] Overlay already present. Skipping creation.');
    return;
  }

  // --------------------------------------------------------
  // Create the black overlay container
  // --------------------------------------------------------
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
  container.style.zIndex = '999999';
  container.style.fontFamily = 'sans-serif';
  container.style.userSelect = 'none';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'flex-start';
  document.body.appendChild(container);

  // --------------------------------------------------------
  // Basic UI elements inside the container
  // --------------------------------------------------------
  const timeDisplay = document.createElement('div');
  timeDisplay.style.fontSize = '18px';
  timeDisplay.style.fontWeight = 'bold';
  timeDisplay.style.marginBottom = '5px';
  container.appendChild(timeDisplay);

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

  const actionButton = document.createElement('button');
  actionButton.style.cursor = 'pointer';
  actionButton.style.fontSize = '14px';
  actionButton.style.padding = '6px 10px';
  actionButton.style.marginTop = '5px';
  actionButton.style.color = '#333';
  actionButton.style.background = '#ccc';
  actionButton.style.border = '1px solid #666';
  actionButton.style.borderRadius = '4px';
  actionButton.textContent = 'Pause';
  container.appendChild(actionButton);

  // --------------------------------------------------------
  // Local state
  // --------------------------------------------------------
  let isCompleted = false;

  // --------------------------------------------------------
  // Listen for changes in chrome.storage.sync
  // --------------------------------------------------------
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.timerState) {
      const newState = changes.timerState.newValue as TimerState;
      console.log('[Mindful Timer] Timer state changed:', newState);
      renderState(newState);
    }
  });

  // --------------------------------------------------------
  // On load, grab the current TimerState from storage
  // --------------------------------------------------------
  chrome.storage.sync.get('timerState', (res) => {
    const ts = res.timerState as TimerState;
    if (ts) {
      renderState(ts);
    } else {
      timeDisplay.textContent = 'No timer running';
      actionButton.textContent = 'Restart';
    }
  });

  // --------------------------------------------------------
  // Close button => remove overlay + notify background
  // --------------------------------------------------------
  closeBtn.addEventListener('click', () => {
    container.remove();
    chrome.runtime.sendMessage({ action: 'closeOverlay' });
  });

  // --------------------------------------------------------
  // Action button => Pause/Resume or Restart
  // --------------------------------------------------------
  actionButton.addEventListener('click', () => {
    if (isCompleted) {
      // If session is complete, "Restart"
      chrome.runtime.sendMessage({ action: 'globalRestart' });
      isCompleted = false;
      actionButton.textContent = 'Pause';
      return;
    }

    // Otherwise => Pause or Resume
    chrome.storage.sync.get('timerState', (res) => {
      const ts = res.timerState as TimerState;
      // If no timer => start a new one
      if (!ts || !ts.isActive) {
        chrome.runtime.sendMessage({ action: 'globalRestart' });
        return;
      }
      // Pause or resume
      if (!ts.isPaused) {
        chrome.runtime.sendMessage({ action: 'pauseTimer' });
        actionButton.textContent = 'Resume';
      } else {
        chrome.runtime.sendMessage({ action: 'resumeTimer' });
        actionButton.textContent = 'Pause';
      }
    });
  });

  // --------------------------------------------------------
  // Listen for runtime messages from background/popup
  // --------------------------------------------------------
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.action) {
      case 'timerUpdated':
        // Timer has changed in background => refresh from storage
        chrome.storage.sync.get('timerState', (res) => {
          renderState(res.timerState as TimerState);
        });
        sendResponse({ ack: true });
        break;

      case 'removeOverlay':
        container.remove();
        sendResponse({ ack: true });
        break;

      case 'timerCompleted':
        isCompleted = true;
        timeDisplay.textContent = 'Session Complete!';
        if (msg.isActive && msg.soundUrl) {
          playCompletionSound(msg.soundUrl);
        }
        if (msg.quote) {
          showQuote(msg.quote);
        }
        actionButton.textContent = 'Restart';
        sendResponse({ ack: true });
        break;

      case 'timerStarted':
        isCompleted = false;
        timeDisplay.textContent = 'Starting...';
        actionButton.textContent = 'Pause';
        sendResponse({ ack: true });
        break;

      case 'timerPaused':
        isCompleted = false;
        actionButton.textContent = 'Resume';
        sendResponse({ ack: true });
        break;

      case 'timerResumed':
        isCompleted = false;
        actionButton.textContent = 'Pause';
        sendResponse({ ack: true });
        break;

      case 'timerReset':
        isCompleted = false;
        timeDisplay.textContent = 'No timer running';
        actionButton.textContent = 'Restart';
        sendResponse({ ack: true });
        break;
    }
    return true; // Keep the message channel open
  });

  // --------------------------------------------------------
  // RENDERING HELPER
  // --------------------------------------------------------
  function renderState(ts: TimerState) {
    if (!ts || !ts.isActive) {
      timeDisplay.textContent = 'No timer running';
      actionButton.textContent = 'Restart';
      return;
    }
    // If paused => show leftover
    if (ts.isPaused) {
      timeDisplay.textContent = formatTime(ts.timeLeft);
      actionButton.textContent = 'Resume';
    } else {
      // Timer is running
      timeDisplay.textContent = formatTime(ts.timeLeft);
      actionButton.textContent = 'Pause';
    }
  }

  // --------------------------------------------------------
  // PLAY COMPLETION SOUND
  // --------------------------------------------------------
  function playCompletionSound(soundUrl: string) {
    const audio = new Audio(soundUrl);
    chrome.storage.sync.get('soundVolume', (res) => {
      const volume = (res.soundVolume !== undefined ? res.soundVolume : 100) / 100;
      audio.volume = volume;
      audio.play().catch(err => {
        console.error('[Mindful Timer] Audio playback failed:', err);
      });
    });
  }

  // --------------------------------------------------------
  // SHOW QUOTE
  // --------------------------------------------------------
  function showQuote(quoteText: string) {
    const quoteEl = document.createElement('div');
    quoteEl.className = 'quote-text';
    quoteEl.style.marginTop = '5px';
    quoteEl.style.color = '#fff';
    quoteEl.style.fontSize = '12px';
    quoteEl.textContent = `“${quoteText}”`;
    container.appendChild(quoteEl);
  }

  // --------------------------------------------------------
  // FORMAT TIME mm:ss
  // --------------------------------------------------------
  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
})();
