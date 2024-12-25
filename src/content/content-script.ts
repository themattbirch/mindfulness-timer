(() => {
  console.log("[Mindful Timer] Content script loaded.");

  // 1) Create a container element
  const container = document.createElement("div");
  container.id = "mindful-timer-overlay";
  container.style.all = "initial";  // reset inherited styles
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

  // in content-script.ts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Content script received message:", message);
    // handle it
    sendResponse({ ack: true });
  });

   // Time display
  const timeDisplay = document.createElement("div");
  timeDisplay.style.all = "unset";
  timeDisplay.style.fontSize = "18px";
  timeDisplay.style.fontWeight = "bold";
  timeDisplay.style.color = "#fff";
  container.appendChild(timeDisplay);

  // 3) Create an optional "close" button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.all = "unset";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "5px";
  closeBtn.style.right = "8px";
  closeBtn.style.background = "transparent";
  closeBtn.style.color = "#fff";
  closeBtn.style.border = "none";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "16px";
  container.appendChild(closeBtn);

  closeBtn.addEventListener("click", () => {
    container.remove();
  });

  // 4) Append the container to the page
  document.body.appendChild(container);

  // 5) Function to format time in mm:ss
  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // 6) Periodically fetch `timerState` from storage
  function updateTimerDisplay() {
  chrome.storage.sync.get("timerState", (res) => {
    const ts = res.timerState;

    if (ts && ts.isActive) {
      // If an active timer is found
      if (ts.isPaused) {
        // If paused => show "Paused"
        timeDisplay.textContent = "Paused";
      } else if (ts.endTime) {
        // If running => compute the time left
        const now = Date.now();
        const remainingMs = ts.endTime - now;
        const newTimeLeft = Math.max(0, Math.floor(remainingMs / 1000));
        timeDisplay.textContent = formatTime(newTimeLeft);
      } else {
        // Edge case: isActive but no endTime => maybe show "No timer running"
        timeDisplay.textContent = "No timer running";
      }
    } else {
      // If not active => "No timer running"
      timeDisplay.textContent = "No timer running";
    }

    // Then set Pause/Resume button text
    if (!ts?.isActive) {
      pauseButton.textContent = "Pause";
      pauseButton.disabled = true;
    } else {
      pauseButton.disabled = false;
      pauseButton.textContent = ts.isPaused ? "Resume" : "Pause";
    }
  });
}

  // Create a Pause/Resume button
const pauseButton = document.createElement("button");
pauseButton.style.all = "unset";  
pauseButton.style.display = "inline-block";
pauseButton.textContent = "Pause";
pauseButton.style.cursor = "pointer";
pauseButton.style.fontSize = "14px";
pauseButton.style.padding = "6px 10px";
pauseButton.style.marginTop = "5px";
pauseButton.style.color = "#333";
pauseButton.style.background = "#ccc";
pauseButton.style.border = "1px solid #666";
pauseButton.style.borderRadius = "4px";
container.appendChild(pauseButton);


  pauseButton.addEventListener("click", () => {
    // Toggle pause/resume
    chrome.storage.sync.get("timerState", (res) => {
      const ts = res.timerState;
      if (ts && ts.isActive) {
        if (!ts.isPaused) {
          // Pause the timer
          chrome.runtime.sendMessage({ action: "pauseTimer" });
        } else {
          // Resume the timer
          chrome.runtime.sendMessage({ action: "resumeTimer" });
        }
      }
    });
  });



  // 7) Update every second
  const interval = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();

})();