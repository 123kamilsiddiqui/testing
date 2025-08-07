// Local storage utilities for offline fallback
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

export function clearLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

// Specific local storage keys
export const STORAGE_KEYS = {
  ORDERS: 'rajmahal_orders',
  STAFF_BOOK: 'rajmahal_staff_book',
  ENTRY_STATUSES: 'rajmahal_entry_statuses',
} as const;
