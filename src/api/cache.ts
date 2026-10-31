// src/api/cache.ts
// Cache 2 niveaux : mémoire (5 s) + AsyncStorage (24 h)

import AsyncStorage from "@react-native-async-storage/async-storage";

const ASYNC_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 h

const memoryCache = new Map<string, { data: any; timestamp: number }>();
const MEMORY_CACHE_DURATION = 5000; // 5 s

interface CachedEntry<T> {
  data: T;
  timestamp: number;
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  forceRefresh = false,
): Promise<T> {
  const now = Date.now();

  // 1) Cache mémoire
  const mem = memoryCache.get(key);
  if (!forceRefresh && mem && now - mem.timestamp < MEMORY_CACHE_DURATION) {
    return mem.data;
  }

  // 2) Cache AsyncStorage
  if (!forceRefresh) {
    try {
      const cachedStr = await AsyncStorage.getItem(key);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr) as CachedEntry<T>;
        if (now - cached.timestamp < ASYNC_CACHE_DURATION) {
          memoryCache.set(key, { data: cached.data, timestamp: now });
          return cached.data;
        }
      }
    } catch {
      await AsyncStorage.removeItem(key);
    }
  }

  // 3) Fetch
  const data = await fetcher();
  memoryCache.set(key, { data, timestamp: now });
  await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: now }));
  return data;
}

export async function clearCache(pattern?: string): Promise<void> {
  memoryCache.clear();
  const keys = await AsyncStorage.getAllKeys();
  const toRemove = pattern
    ? keys.filter((k) => k.includes(pattern))
    : keys.filter(
        (k) =>
          k.startsWith("event_") ||
          k.startsWith("allEvents") ||
          k.startsWith("birthday_") ||
          k.startsWith("conference_") ||
          k.startsWith("invitation_"),
      );
  if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
}
