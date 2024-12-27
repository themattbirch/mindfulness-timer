// src/utils/storage.ts

export async function getStorageData(keys: string[]): Promise<any> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result);
    });
  });
}

export async function setStorageData(data: any): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, () => {
      resolve();
    });
  });
}
