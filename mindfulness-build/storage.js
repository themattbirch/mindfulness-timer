async function s(e){return new Promise(t=>{chrome.storage.sync.get(e,r=>{t(r)})})}async function a(e){return new Promise(t=>{chrome.storage.sync.set(e,()=>{t()})})}export{s as g,a as s};
