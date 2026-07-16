/* ========================================
   CACHE SERVICE - IndexedDB cache management
   Supports multiple stores (Users, Admins, Battles, Goals, Diary, Activities)
   ======================================== */

const DB_NAME = 'App_Cache';
const DB_VERSION = 6; // ✅ Actualizado para incluir ACTIVITIES

export const STORES = {
    USERS: 'users',
    ADMINS: 'admins',
    BATTLES: 'battles',
    GOALS: 'goals',
    DIARY: 'diary',
    ACTIVITIES: 'activities', // ✅ Nuevo store para actividades
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

            // Create Battles store
            if (!database.objectStoreNames.contains(STORES.BATTLES)) {
                database.createObjectStore(STORES.BATTLES, { keyPath: 'id' });
                console.log('📦 Store created:', STORES.BATTLES);
            }

            // Create Goals store
            if (!database.objectStoreNames.contains(STORES.GOALS)) {
                database.createObjectStore(STORES.GOALS, { keyPath: 'id' });
                console.log('📦 Store created:', STORES.GOALS);
            }

            // Create Diary store
            if (!database.objectStoreNames.contains(STORES.DIARY)) {
                database.createObjectStore(STORES.DIARY, { keyPath: 'id' });
                console.log('📦 Store created:', STORES.DIARY);
            }

            // ✅ Create Activities store
            if (!database.objectStoreNames.contains(STORES.ACTIVITIES)) {
                database.createObjectStore(STORES.ACTIVITIES, { keyPath: 'id' });
                console.log('📦 Store created:', STORES.ACTIVITIES);
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

export async function clearBattleCache() {
    return await clearCache(STORES.BATTLES);
}

export async function clearGoalCache() {
    return await clearCache(STORES.GOALS);
}

export async function clearDiaryCache() {
    return await clearCache(STORES.DIARY);
}

// ✅ Nueva función para limpiar cache de actividades
export async function clearActivityCache() {
    return await clearCache(STORES.ACTIVITIES);
}

export const CacheService = {
    setCache,
    getCache,
    clearCache,
    clearAllCache,
    clearUserCache,
    clearAdminCache,
    clearBattleCache,
    clearGoalCache,
    clearDiaryCache,
    clearActivityCache, // ✅ Nueva función
    STORES
};