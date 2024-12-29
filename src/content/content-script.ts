// src/content/content-script.ts

/// <reference types="chrome"/>

import { TimerState } from '../types/app';

(() => {
  console.log("[Mindful Timer] Content script loaded.");

  // Avoid duplicates
  if (document.getElementById("mindful-timer-overlay")) {
    console.log("[Mindful Timer] Overlay already exists. Skipping creation.");
    return; 
  }

  let intervalId: ReturnType<typeof setInterval> | undefined;
  let isCompleted = false; // Local flag to manage completion state

  // Container setup
  const container = document.createElement("div");
  container.id = "mindful-timer-overlay";
  container.style.all = "initial";
  container.style.fontFamily = "sans-serif";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.width = "150px";
  container.style.height = "auto";
  container.style.background = "rgba(0, 0, 0, 0.7)";
  container.style.color = "#fff";
  container.style.borderRadius = "8px";
  container.style.padding = "10px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.fontSize = "14px";
  container.style.zIndex = "999999";
  container.style.userSelect = "none";

  // Listen for messages
  chrome.runtime.onMessage.addListener((msg: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log("[Mindful Timer] Received message:", msg);
    
    if (msg.action === 'removeOverlay') {
      console.log("[Mindful Timer] Removing overlay as per message.");
      container.remove();
      if (intervalId) clearInterval(intervalId);
      sendResponse({ ack: true });
    } else if (msg.action === 'timerCompleted') {
      console.log("[Mindful Timer] Handling timerCompleted message.");
      isCompleted = true;

      // Show final text
      timeDisplay.textContent = "Session Complete!";
      console.log("[Mindful Timer] Displayed 'Session Complete!'");

      // Play sound only if the tab is active and soundUrl is provided
      if (msg.isActive && msg.soundUrl) {
        console.log("[Mindful Timer] Playing sound:", msg.soundUrl);
        playCompletionSound(msg.soundUrl);
      } else {
        console.log("[Mindful Timer] Sound not played. Either not active tab or no soundUrl provided.");
      }

      // Show quote
      if (msg.quote) {
        console.log("[Mindful Timer] Displaying quote:", msg.quote);
        showQuoteInOverlay(msg.quote);
      } else {
        console.log("[Mindful Timer] No quote to display.");
      }

      // Update button text to "Restart"
      actionButton.textContent = "Restart";
      sendResponse({ ack: true });
    }
    return true;
  });

  // Time display
  const timeDisplay = document.createElement("div");
  timeDisplay.style.all = "unset";
  timeDisplay.style.fontSize = "18px";
  timeDisplay.style.fontWeight = "bold";
  timeDisplay.style.color = "#fff";
  container.appendChild(timeDisplay);

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.all = "unset";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "5px";
  closeBtn.style.right = "8px";
  closeBtn.style.color = "#fff";
  closeBtn.style.background = "transparent";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "16px";
  container.appendChild(closeBtn);

  closeBtn.addEventListener("click", () => {
    console.log("[Mindful Timer] Close button clicked. Removing overlay.");
    container.remove();
    if (intervalId) clearInterval(intervalId);

    // Send message to kill globally
    chrome.runtime.sendMessage({ action: "closeOverlay" });
  });

  // Pause/Resume/Restart button
  const actionButton = document.createElement("button");
  actionButton.style.all = "unset";
  actionButton.style.display = "inline-block";
  actionButton.style.cursor = "pointer";
  actionButton.style.fontSize = "14px";
  actionButton.style.padding = "6px 10px";
  actionButton.style.marginTop = "5px";
  actionButton.style.color = "#333";
  actionButton.style.background = "#ccc";
  actionButton.style.border = "1px solid #666";
  actionButton.style.borderRadius = "4px";
  actionButton.textContent = "Pause"; // Initial text
  container.appendChild(actionButton);

  actionButton.addEventListener("click", () => {
  console.log("[Mindful Timer] Action button clicked.");
  if (isCompleted) {
    // Handle Restart
    console.log("[Mindful Timer] Sending globalRestart message.");
    chrome.runtime.sendMessage({ 
      action: 'globalRestart' 
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("[Mindful Timer] Failed to send globalRestart:", chrome.runtime.lastError);
      } else {
        console.log("[Mindful Timer] globalRestart response:", response);
        // Reset local state
        isCompleted = false;
        actionButton.textContent = "Pause";
        // Remove existing quote if any
        const existingQuote = container.querySelector(".quote-text");
        if (existingQuote) {
          existingQuote.remove();
        }
      }
    });
  } else {
    // Handle Pause/Resume (existing code)
    chrome.storage.sync.get("timerState", (res: any) => {
      const ts: TimerState = res.timerState;
      if (ts && ts.isActive) {
        if (!ts.isPaused) {
          chrome.runtime.sendMessage({ action: "pauseTimer" });
          actionButton.textContent = "Resume";
        } else {
          chrome.runtime.sendMessage({ action: "resumeTimer" });
          actionButton.textContent = "Pause";
        }
      }
    });
  }
});

  document.body.appendChild(container);
  console.log("[Mindful Timer] Overlay created and appended to DOM.");

  // Format helper
  function formatTime(s: number): string {
    const m = Math.floor(s / 60).toString().padStart(2,"0");
    const sc = (s % 60).toString().padStart(2,"0");
    return `${m}:${sc}`;
  }

  // Play sound function
  function playCompletionSound(soundUrl: string): void {
    console.log("[Mindful Timer] Attempting to play sound:", soundUrl);
    const audio = new Audio(soundUrl);
    chrome.storage.sync.get('soundVolume', (res: any) => {
      const volume = res.soundVolume !== undefined ? res.soundVolume / 100 : 1.0;
      audio.volume = volume;
      audio.play().then(() => {
        console.log("[Mindful Timer] Audio playback started.");
      }).catch((err: any) => {
        console.error('Audio playback failed:', err);
      });
    });
  }

  // Show quote in overlay
  function showQuoteInOverlay(quote: string) {
    const quoteEl = document.createElement("div");
    quoteEl.className = "quote-text";
    quoteEl.style.marginTop = "5px";
    quoteEl.style.color = "#fff";
    quoteEl.style.fontSize = "12px";
    quoteEl.textContent = `“${quote}”`;
    container.appendChild(quoteEl);
    console.log("[Mindful Timer] Quote displayed:", quote);
  }

  // Example function if you want a local “random quote”
  function showRandomQuote(): void {
    const randomQuotes: string[] = [
      "Focus on the here and now.",
      "One breath at a time.",
      "Your mindful break is your superpower."
    ];
    const pick: string = randomQuotes[Math.floor(Math.random() * randomQuotes.length)];

    const localQuoteEl = document.createElement("div");
    localQuoteEl.className = "quote-text";
    localQuoteEl.style.marginTop = "5px";
    localQuoteEl.style.color = "#fff";
    localQuoteEl.style.fontSize = "12px";
    localQuoteEl.textContent = `“${pick}”`;
    container.appendChild(localQuoteEl);
    console.log("[Mindful Timer] Random quote displayed:", pick);
  }

  function updateTimerDisplay(): void {
  if (isCompleted) return;

  chrome.storage.sync.get("timerState", (res: any) => {
    const ts: TimerState = res.timerState;
    if (ts && ts.isActive) {
      if (ts.isPaused) {
        timeDisplay.textContent = formatTime(ts.timeLeft);
        actionButton.textContent = "Resume";
      } else if (ts.endTime) {
        const now: number = Date.now();
        const remainingMs: number = ts.endTime - now;
        const newTimeLeft: number = Math.max(0, Math.floor(remainingMs / 1000));
        timeDisplay.textContent = formatTime(newTimeLeft);
        actionButton.textContent = "Pause";
      }

      // Reset completion flag and cleanup quote if needed
      isCompleted = false;
      const existingQuote = container.querySelector(".quote-text");
      if (existingQuote) {
        existingQuote.remove();
        console.log("[Mindful Timer] Existing quote removed.");
      }
    } else {
      if (!isCompleted) {
        timeDisplay.textContent = "No timer running";
        console.log("[Mindful Timer] Displaying 'No timer running'.");
      }

      actionButton.disabled = !ts?.isActive;
      if (!ts?.isActive) {
        actionButton.textContent = "Pause";
      }
    }
  });
}

  intervalId = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
})();