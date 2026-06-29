/* ========================================
   DIARY REPOSITORY - Operaciones CRUD en Firebase
   ======================================== */

import { db } from '../../config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const DIARY_COLLECTION = 'diary';

export const DiaryRepository = {
    /**
     * Guardar entrada en Firestore
     */
    async save(entryData) {
        try {
            console.log('💾 DiaryRepository.save - Datos recibidos:', entryData);
            
            if (!entryData || !entryData.id) {
                console.error('❌ Error: entryData.id es undefined o null');
                throw new Error('El ID de la entrada es obligatorio');
            }

            const entryRef = doc(db, DIARY_COLLECTION, entryData.id);
            await setDoc(entryRef, entryData);
            
            console.log('✅ Entrada guardada exitosamente en:', `diary/${entryData.id}`);
            return { id: entryData.id, ...entryData };
        } catch (error) {
            console.error('❌ Error en DiaryRepository.save:', error);
            throw error;
        }
    },

    /**
     * Obtener entrada por ID
     */
    async getById(entryId) {
        try {
            if (!entryId) {
                throw new Error('El ID de la entrada es obligatorio');
            }
            
            const entryRef = doc(db, DIARY_COLLECTION, entryId);
            const docSnap = await getDoc(entryRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error en DiaryRepository.getById:', error);
            throw error;
        }
    },

    /**
     * Obtener entradas por usuario
     */
    async getByUserId(userId, filters = {}) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            let constraints = [where('userId', '==', userId)];
            
            // Filtros opcionales
            if (filters.tag) {
                constraints.push(where('tag', '==', filters.tag));
            }
            if (filters.battleId) {
                constraints.push(where('battleId', '==', filters.battleId));
            }
            if (filters.goalId) {
                constraints.push(where('goalId', '==', filters.goalId));
            }
            
            // Ordenamiento
            if (filters.orderBy) {
                constraints.push(orderBy(filters.orderBy.field, filters.orderBy.direction || 'desc'));
            } else {
                constraints.push(orderBy('date', 'desc'));
            }
            
            if (filters.limit) {
                constraints.push(limit(filters.limit));
            }

            const q = query(collection(db, DIARY_COLLECTION), ...constraints);
            const querySnapshot = await getDocs(q);
            
            const entries = [];
            querySnapshot.forEach((doc) => {
                entries.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`📋 ${entries.length} entradas encontradas para usuario ${userId}`);
            return entries;
        } catch (error) {
            console.error('❌ Error en DiaryRepository.getByUserId:', error);
            throw error;
        }
    },

    /**
     * Obtener entradas recientes
     */
    async getRecent(userId, limitCount = 5) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            const q = query(
                collection(db, DIARY_COLLECTION),
                where('userId', '==', userId),
                orderBy('date', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            
            const entries = [];
            querySnapshot.forEach((doc) => {
                entries.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`📋 ${entries.length} entradas recientes encontradas`);
            return entries;
        } catch (error) {
            console.error('❌ Error en DiaryRepository.getRecent:', error);
            throw error;
        }
    },

    /**
     * Actualizar entrada
     */
    async update(entryId, updateData) {
        try {
            if (!entryId) {
                throw new Error('El ID de la entrada es obligatorio');
            }
            
            const entryRef = doc(db, DIARY_COLLECTION, entryId);
            
            const dataToUpdate = {
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            await updateDoc(entryRef, dataToUpdate);
            
            console.log(`🔄 Entrada ${entryId} actualizada`);
            return await this.getById(entryId);
        } catch (error) {
            console.error('❌ Error en DiaryRepository.update:', error);
            throw error;
        }
    },

    /**
     * Eliminar entrada
     */
    async delete(entryId) {
        try {
            if (!entryId) {
                throw new Error('El ID de la entrada es obligatorio');
            }
            
            const entryRef = doc(db, DIARY_COLLECTION, entryId);
            await deleteDoc(entryRef);
            
            console.log(`🗑️ Entrada ${entryId} eliminada`);
            return true;
        } catch (error) {
            console.error('❌ Error en DiaryRepository.delete:', error);
            throw error;
        }
    },

    /**
     * Eliminar todas las entradas de un usuario
     */
    async deleteByUserId(userId) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            const entries = await this.getByUserId(userId);
            const deletePromises = entries.map(entry => this.delete(entry.id));
            await Promise.all(deletePromises);
            
            console.log(`🗑️ ${entries.length} entradas eliminadas para usuario ${userId}`);
            return true;
        } catch (error) {
            console.error('❌ Error en DiaryRepository.deleteByUserId:', error);
            throw error;
        }
    },

    /**
     * Obtener estadísticas de entradas
     */
    async getStats(userId) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            const q = query(
                collection(db, DIARY_COLLECTION),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            
            const stats = {
                total: 0,
                byTag: {}
            };
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                stats.total++;
                
                const tag = data.tag || 'reflection';
                if (!stats.byTag[tag]) {
                    stats.byTag[tag] = 0;
                }
                stats.byTag[tag]++;
            });
            
            console.log('📊 Estadísticas de diario calculadas:', stats);
            return stats;
        } catch (error) {
            console.error('❌ Error en DiaryRepository.getStats:', error);
            throw error;
        }
    }
};