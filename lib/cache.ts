// Simple in-memory cache (ใช้แทน Redis สำหรับ development)
// For production, recommend using Upstash Redis or similar

interface CacheItem {
  value: unknown;
  expiry: number;
}

class SimpleCache {
  private cache: Map<string, CacheItem>;

  constructor() {
    this.cache = new Map();
    // Clean expired items every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set(key: string, value: unknown, ttlSeconds: number): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Helper: Set with expiry in seconds
  setex(key: string, seconds: number, value: unknown): void {
    this.set(key, value, seconds);
  }

  // Helper: Get and parse JSON
  getJSON<T>(key: string): T | null {
    const value = this.get<string>(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  // Helper: Set and stringify JSON
  setJSON(key: string, value: unknown, ttlSeconds: number): void {
    this.set(key, JSON.stringify(value), ttlSeconds);
  }
}

// Create singleton instance
const cache = new SimpleCache();

export default cache;

// Export helper functions
export const { set, get, delete: del, clear, setex } = cache;
export const getJSON = cache.getJSON.bind(cache);
export const setJSON = cache.setJSON.bind(cache);

