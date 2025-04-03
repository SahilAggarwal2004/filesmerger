const getStorageInstance = (local = true) => (local ? localStorage : sessionStorage);

export const setStorage = (key: string, value: unknown, local = true) => getStorageInstance(local).setItem(key, JSON.stringify(value));

export const removeStorage = (key: string, local = true) => getStorageInstance(local).removeItem(key);

export function getStorage<T>(key: string, fallbackValue: T | null = null, local: boolean = true): T | null {
  const value = getStorageInstance(local).getItem(key);
  if (value) {
    try {
      return JSON.parse(value);
    } catch {
      removeStorage(key, local); // Remove corrupted data
    }
  }
  if (fallbackValue !== null && fallbackValue !== undefined) setStorage(key, fallbackValue, local);
  return fallbackValue;
}
