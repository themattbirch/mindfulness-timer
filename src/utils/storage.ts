// src/utils/storage.ts

import { AppSettings } from '../types/app';

/**
 * Fetches settings from Chrome storage.
 * @param keys - Array of keys from AppSettings to retrieve.
 * @returns A promise that resolves to a partial AppSettings object.
 */
export async function getStorageData(keys: (keyof AppSettings)[]): Promise<Partial<AppSettings>> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result as Partial<AppSettings>);
    });
  });
}

/**
 * Sets settings in Chrome storage.
 * @param data - Partial AppSettings object to set.
 * @returns A promise that resolves when the data is set.
 */
export async function setStorageData(data: Partial<AppSettings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, () => {
      resolve();
    });
  });
}
