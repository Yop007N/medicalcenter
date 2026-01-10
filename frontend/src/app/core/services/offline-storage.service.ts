import { Injectable } from '@angular/core';

export interface SyncQueueItem {
  id: string;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId?: number;
  data: any;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  retryCount: number;
}

const DB_NAME = 'medical-services-offline';
const DB_VERSION = 1;
const SYNC_QUEUE_STORE = 'sync-queue';
const CACHE_STORE = 'data-cache';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Sync queue store
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('entityType', 'entityType', { unique: false });
        }

        // Data cache store
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          const cacheStore = db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
          cacheStore.createIndex('entityType', 'entityType', { unique: false });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDatabase();
    }
    return this.db!;
  }

  // Sync Queue Methods
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const db = await this.ensureDb();
    const id = `${item.entityType}-${item.action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queueItem: SyncQueueItem = {
      ...item,
      id,
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.add(queueItem);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSyncQueueCount(): Promise<number> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Cache Methods
  async cacheData(key: string, entityType: string, data: any, ttlMinutes: number = 60): Promise<void> {
    const db = await this.ensureDb();

    const cacheItem = {
      key,
      entityType,
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (ttlMinutes * 60 * 1000)
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.put(cacheItem);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE], 'readonly');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (result.expiresAt < Date.now()) {
          this.removeCachedData(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
    });
  }

  async removeCachedData(key: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearExpiredCache(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      const index = store.index('expiresAt');
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  async clearAllCache(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
