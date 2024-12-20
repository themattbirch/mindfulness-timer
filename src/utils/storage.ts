// src/utils/storage.ts

import { StorageData } from '../types/app';

/**
 * Fetches data from Chrome storage.
 * @param keys - Array of keys from StorageData to retrieve.
 * @returns A promise that resolves to an object containing the requested keys.
 */
export async function getStorageData<K extends keyof StorageData>(keys: K[]): Promise<Pick<StorageData, K>> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result as Pick<StorageData, K>);
    });
  });
}

/**
 * Sets data in Chrome storage.
 * @param data - An object containing key-value pairs from StorageData to set.
 * @returns A promise that resolves when the data is set.
 */
export async function setStorageData<K extends keyof StorageData>(data: Pick<StorageData, K>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, () => {
      resolve();
    });
  });
}
