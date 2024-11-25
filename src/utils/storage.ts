export interface StorageData {
  interval: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark';
  soundVolume: number;
  autoStartTimer: boolean;
  showQuotes: boolean;
  quoteChangeInterval: number;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  isFavorite?: boolean;
}

export interface Session {
  date: string;
  duration: number;
  completedBreaks: number;
}

export const getStorageData = (keys: (keyof StorageData)[]) => {
  return new Promise<Partial<StorageData>>((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result as Partial<StorageData>);
    });
  });
};

export const setStorageData = (data: Partial<StorageData>) => {
  return new Promise<void>((resolve) => {
    chrome.storage.sync.set(data, resolve);
  });
}; 