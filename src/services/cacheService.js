/* ========================================
   CACHE SERVICE - IndexedDB cache management
   Supports both Users and Admins
   ======================================== */

const DB_NAME = 'App_Cache';
const DB_VERSION = 2; // ✅ Updated version for new stores

export const STORES = {
    USERS: 'users',
    ADMINS: 'admins',
    // Add more stores as needed
};

let db = null;

async function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Error opening IndexedDB:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('✅ IndexedDB initialized');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create Users store
            if (!database.objectStoreNames.contains(STORES.USERS)) {
                database.createObjectStore(STORES.USERS, { keyPath: 'id' });
                console.log('📦 Store created:', STORES.USERS);
            }

            // Create Admins store
            if (!database.objectStoreNames.contains(STORES.ADMINS)) {
                database.createObjectStore(STORES.ADMINS, { keyPath: 'id' });
                console.log('📦 Store created:', STORES.ADMINS);
            }
        };
    });
}

export async function setCache(storeName, id, data, ttl = 3600000) {
    try {
        const database = await initDB();

        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" does not exist`);
            return false;
        }

        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        const cacheItem = {
            id: id,
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        };

        return new Promise((resolve, reject) => {
            const request = store.put(cacheItem);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error saving to cache:', error);
        return false;
    }
}

export async function getCache(storeName, id) {
    try {
        const database = await initDB();

        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" does not exist`);
            return null;
        }

        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                const result = request.result;
                if (result && (Date.now() - result.timestamp) < result.ttl) {
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting from cache:', error);
        return null;
    }
}

export async function clearCache(storeName) {
    try {
        const database = await initDB();

        if (!database.objectStoreNames.contains(storeName)) {
            console.warn(`⚠️ Store "${storeName}" does not exist, cannot clear`);
            return false;
        }

        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error clearing cache:', error);
        return false;
    }
}

export async function clearAllCache() {
    try {
        const database = await initDB();

        for (const storeName of Object.values(STORES)) {
            if (database.objectStoreNames.contains(storeName)) {
                const transaction = database.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                });
                console.log(`🗑️ Store cleared: ${storeName}`);
            }
        }

        console.log('✅ Cache completely cleared');
        return true;
    } catch (error) {
        console.error('Error clearing cache:', error);
        return false;
    }
}

export async function clearUserCache() {
    return await clearCache(STORES.USERS);
}

export async function clearAdminCache() {
    return await clearCache(STORES.ADMINS);
}

export const CacheService = {
    setCache,
    getCache,
    clearCache,
    clearAllCache,
    clearUserCache,
    clearAdminCache,
    STORES
};