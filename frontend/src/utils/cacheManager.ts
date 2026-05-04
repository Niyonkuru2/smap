/**
 * Cache Manager for Frontend Storage
 * Manages browser storage (localStorage, IndexedDB) with TTL and cleanup
 */

interface CacheItem<T> {
  value: T;
  expiresAt: number;
  size: number;
}

interface StorageStats {
  totalSize: number;
  itemCount: number;
  oldestItem: string | null;
  newestItem: string | null;
  items: Array<{
    key: string;
    size: number;
    age: number;
    expiresIn: number;
  }>;
}

class CacheManager {
  private storageKey = 'app_cache_';
  private metaKey = 'app_cache_meta_';
  private maxStorageSize = 5 * 1024 * 1024; // 5MB

  /**
   * Set cache item with TTL (Time To Live)
   * @param key Unique cache key
   * @param value Data to cache
   * @param ttlMinutes Time to live in minutes (default: 60)
   */
  set<T>(key: string, value: T, ttlMinutes: number = 60): boolean {
    try {
      const serialized = JSON.stringify(value);
      const size = new Blob([serialized]).size;

      // Check if adding this would exceed max size
      if (this.getTotalStorageSize() + size > this.maxStorageSize) {
        console.warn('🗑️ Cache full, removing oldest items...');
        this.cleanup(Math.ceil((size + 1024 * 100) / 1024)); // Free up space
      }

      const item: CacheItem<T> = {
        value,
        expiresAt: Date.now() + ttlMinutes * 60 * 1000,
        size,
      };

      localStorage.setItem(this.storageKey + key, JSON.stringify(item));
      console.log(`✅ Cached: ${key} (${this.formatBytes(size)})`);
      return true;
    } catch (error) {
      console.error('❌ Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache item (returns null if expired)
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.storageKey + key);
      if (!item) return null;

      const cached = JSON.parse(item) as CacheItem<T>;

      if (Date.now() > cached.expiresAt) {
        console.log(`⏰ Cache expired: ${key}`);
        this.remove(key);
        return null;
      }

      console.log(`✓ Cache hit: ${key}`);
      return cached.value;
    } catch (error) {
      console.error('❌ Cache get error:', error);
      return null;
    }
  }

  /**
   * Remove specific cache item
   */
  remove(key: string): void {
    localStorage.removeItem(this.storageKey + key);
    localStorage.removeItem(this.metaKey + key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.storageKey)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(k => k.startsWith(this.storageKey));

    let totalSize = 0;
    const items: Array<{
      key: string;
      size: number;
      age: number;
      expiresIn: number;
    }> = [];

    cacheKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return;

        const cached = JSON.parse(item) as CacheItem<any>;
        const age = Math.floor((Date.now() - cached.expiresAt + (60 * 60 * 1000)) / 1000); // Age in seconds
        const expiresIn = Math.max(0, cached.expiresAt - Date.now());

        totalSize += cached.size || 0;
        items.push({
          key: key.replace(this.storageKey, ''),
          size: cached.size || 0,
          age,
          expiresIn,
        });
      } catch (e) {
        // Skip items that can't be parsed
      }
    });

    items.sort((a, b) => a.age - b.age);

    return {
      totalSize,
      itemCount: items.length,
      oldestItem: items.length > 0 ? items[0].key : null,
      newestItem: items.length > 0 ? items[items.length - 1].key : null,
      items,
    };
  }

  /**
   * Auto-cleanup expired items and old items if storage exceeds threshold
   */
  cleanup(targetFreeSizeKB: number = 512): void {
    const stats = this.getStats();

    // Remove all expired items first
    stats.items
      .filter(item => item.expiresIn <= 0)
      .forEach(item => this.remove(item.key));

    // If still over threshold, remove oldest items
    if (stats.totalSize > this.maxStorageSize - targetFreeSizeKB * 1024) {
      stats.items
        .sort((a, b) => a.age - b.age)
        .slice(0, Math.ceil(stats.items.length * 0.3))
        .forEach(item => this.remove(item.key));
      
      console.log('🧹 Cleaned up old cache items');
    }
  }

  /**
   * Format bytes to human-readable size
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get total storage size in bytes
   */
  private getTotalStorageSize(): number {
    return this.getStats().totalSize;
  }

  /**
   * Get formatted total storage size
   */
  getFormattedTotalSize(): string {
    return this.getFormattedSize(this.getTotalStorageSize());
  }

  /**
   * Get formatted size string
   */
  getFormattedSize(bytes: number): string {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default new CacheManager();
