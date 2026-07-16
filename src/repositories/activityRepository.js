/* ========================================
   ACTIVITY REPOSITORY - Operaciones CRUD en Firebase
   ======================================== */

import { db } from '../../config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const ACTIVITIES_COLLECTION = 'activities';

export const ActivityRepository = {
    /**
     * Guardar actividad en Firestore
     */
    async save(activityData) {
        try {
            console.log('💾 ActivityRepository.save - Datos recibidos:', activityData);
            
            if (!activityData || !activityData.id) {
                console.error('❌ Error: activityData.id es undefined o null');
                throw new Error('El ID de la actividad es obligatorio');
            }

            const activityRef = doc(db, ACTIVITIES_COLLECTION, activityData.id);
            await setDoc(activityRef, activityData);
            
            console.log('✅ Actividad guardada exitosamente en:', `activities/${activityData.id}`);
            return { id: activityData.id, ...activityData };
        } catch (error) {
            console.error('❌ Error en ActivityRepository.save:', error);
            throw error;
        }
    },

    /**
     * Obtener actividad por ID
     */
    async getById(activityId) {
        try {
            if (!activityId) {
                throw new Error('El ID de la actividad es obligatorio');
            }
            
            const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
            const docSnap = await getDoc(activityRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error en ActivityRepository.getById:', error);
            throw error;
        }
    },

    /**
     * Obtener actividades activas
     */
    async getActive(filters = {}) {
        try {
            let constraints = [where('isActive', '==', true)];
            
            // Filtros opcionales
            if (filters.category) {
                constraints.push(where('category', '==', filters.category));
            }
            if (filters.difficulty) {
                constraints.push(where('difficulty', '==', filters.difficulty));
            }
            
            // Ordenamiento
            if (filters.orderBy) {
                constraints.push(orderBy(filters.orderBy.field, filters.orderBy.direction || 'desc'));
            } else {
                constraints.push(orderBy('createdAt', 'desc'));
            }
            
            if (filters.limit) {
                constraints.push(limit(filters.limit));
            }

            const q = query(collection(db, ACTIVITIES_COLLECTION), ...constraints);
            const querySnapshot = await getDocs(q);
            
            const activities = [];
            querySnapshot.forEach((doc) => {
                activities.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`📋 ${activities.length} actividades activas encontradas`);
            return activities;
        } catch (error) {
            console.error('❌ Error en ActivityRepository.getActive:', error);
            throw error;
        }
    },

    /**
     * Obtener todas las actividades (admin)
     */
    async getAll(filters = {}) {
        try {
            let constraints = [];
            
            // Filtros opcionales
            if (filters.category) {
                constraints.push(where('category', '==', filters.category));
            }
            if (filters.difficulty) {
                constraints.push(where('difficulty', '==', filters.difficulty));
            }
            if (filters.isActive !== undefined) {
                constraints.push(where('isActive', '==', filters.isActive));
            }
            if (filters.status) {
                constraints.push(where('status', '==', filters.status));
            }
            
            // Ordenamiento
            if (filters.orderBy) {
                constraints.push(orderBy(filters.orderBy.field, filters.orderBy.direction || 'desc'));
            } else {
                constraints.push(orderBy('createdAt', 'desc'));
            }
            
            if (filters.limit) {
                constraints.push(limit(filters.limit));
            }

            const q = query(collection(db, ACTIVITIES_COLLECTION), ...constraints);
            const querySnapshot = await getDocs(q);
            
            const activities = [];
            querySnapshot.forEach((doc) => {
                activities.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`📋 ${activities.length} actividades encontradas`);
            return activities;
        } catch (error) {
            console.error('❌ Error en ActivityRepository.getAll:', error);
            throw error;
        }
    },

    /**
     * Actualizar actividad
     */
    async update(activityId, updateData) {
        try {
            if (!activityId) {
                throw new Error('El ID de la actividad es obligatorio');
            }
            
            const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
            
            const dataToUpdate = {
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            await updateDoc(activityRef, dataToUpdate);
            
            console.log(`🔄 Actividad ${activityId} actualizada`);
            return await this.getById(activityId);
        } catch (error) {
            console.error('❌ Error en ActivityRepository.update:', error);
            throw error;
        }
    },

    /**
     * Eliminar actividad
     */
    async delete(activityId) {
        try {
            if (!activityId) {
                throw new Error('El ID de la actividad es obligatorio');
            }
            
            const activityRef = doc(db, ACTIVITIES_COLLECTION, activityId);
            await deleteDoc(activityRef);
            
            console.log(`🗑️ Actividad ${activityId} eliminada`);
            return true;
        } catch (error) {
            console.error('❌ Error en ActivityRepository.delete:', error);
            throw error;
        }
    },

    /**
     * Obtener estadísticas de actividades
     */
    async getStats() {
        try {
            const q = query(collection(db, ACTIVITIES_COLLECTION));
            const snapshot = await getDocs(q);
            
            const stats = {
                total: 0,
                active: 0,
                inactive: 0,
                totalCompletions: 0,
                byCategory: {},
                byDifficulty: {}
            };
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                stats.total++;
                
                if (data.isActive) {
                    stats.active++;
                } else {
                    stats.inactive++;
                }
                
                stats.totalCompletions += (data.timesCompleted || 0);
                
                // Por categoría
                const category = data.category || 'otros';
                if (!stats.byCategory[category]) {
                    stats.byCategory[category] = { total: 0, active: 0, completions: 0 };
                }
                stats.byCategory[category].total++;
                if (data.isActive) {
                    stats.byCategory[category].active++;
                }
                stats.byCategory[category].completions += (data.timesCompleted || 0);
                
                // Por dificultad
                const difficulty = data.difficulty || 'easy';
                if (!stats.byDifficulty[difficulty]) {
                    stats.byDifficulty[difficulty] = { total: 0, active: 0 };
                }
                stats.byDifficulty[difficulty].total++;
                if (data.isActive) {
                    stats.byDifficulty[difficulty].active++;
                }
            });
            
            console.log('📊 Estadísticas de actividades calculadas:', stats);
            return stats;
        } catch (error) {
            console.error('❌ Error en ActivityRepository.getStats:', error);
            throw error;
        }
    }
};