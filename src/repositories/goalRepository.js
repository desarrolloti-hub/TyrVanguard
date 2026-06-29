/* ========================================
   GOAL REPOSITORY - Operaciones CRUD en Firebase
   ======================================== */

import { db } from '../../config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const GOALS_COLLECTION = 'goals';

export const GoalRepository = {
    /**
     * Guardar meta en Firestore
     */
    async save(goalData) {
        try {
            console.log('💾 GoalRepository.save - Datos recibidos:', goalData);
            
            if (!goalData || !goalData.id) {
                console.error('❌ Error: goalData.id es undefined o null');
                throw new Error('El ID de la meta es obligatorio');
            }

            const goalRef = doc(db, GOALS_COLLECTION, goalData.id);
            await setDoc(goalRef, goalData);
            
            console.log('✅ Meta guardada exitosamente en:', `goals/${goalData.id}`);
            return { id: goalData.id, ...goalData };
        } catch (error) {
            console.error('❌ Error en GoalRepository.save:', error);
            throw error;
        }
    },

    /**
     * Obtener meta por ID
     */
    async getById(goalId) {
        try {
            if (!goalId) {
                throw new Error('El ID de la meta es obligatorio');
            }
            
            const goalRef = doc(db, GOALS_COLLECTION, goalId);
            const docSnap = await getDoc(goalRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error en GoalRepository.getById:', error);
            throw error;
        }
    },

    /**
     * Obtener metas por usuario
     */
    async getByUserId(userId, filters = {}) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            let constraints = [where('userId', '==', userId)];
            
            // Filtros opcionales
            if (filters.status) {
                constraints.push(where('status', '==', filters.status));
            }
            if (filters.category) {
                constraints.push(where('category', '==', filters.category));
            }
            if (filters.completed !== undefined) {
                constraints.push(where('completed', '==', filters.completed));
            }
            if (filters.battleId) {
                constraints.push(where('battleId', '==', filters.battleId));
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

            const q = query(collection(db, GOALS_COLLECTION), ...constraints);
            const querySnapshot = await getDocs(q);
            
            const goals = [];
            querySnapshot.forEach((doc) => {
                goals.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`📋 ${goals.length} metas encontradas para usuario ${userId}`);
            return goals;
        } catch (error) {
            console.error('❌ Error en GoalRepository.getByUserId:', error);
            throw error;
        }
    },

    /**
     * Actualizar meta
     */
    async update(goalId, updateData) {
        try {
            if (!goalId) {
                throw new Error('El ID de la meta es obligatorio');
            }
            
            const goalRef = doc(db, GOALS_COLLECTION, goalId);
            
            const dataToUpdate = {
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            await updateDoc(goalRef, dataToUpdate);
            
            console.log(`🔄 Meta ${goalId} actualizada`);
            return await this.getById(goalId);
        } catch (error) {
            console.error('❌ Error en GoalRepository.update:', error);
            throw error;
        }
    },

    /**
     * Eliminar meta
     */
    async delete(goalId) {
        try {
            if (!goalId) {
                throw new Error('El ID de la meta es obligatorio');
            }
            
            const goalRef = doc(db, GOALS_COLLECTION, goalId);
            await deleteDoc(goalRef);
            
            console.log(`🗑️ Meta ${goalId} eliminada`);
            return true;
        } catch (error) {
            console.error('❌ Error en GoalRepository.delete:', error);
            throw error;
        }
    },

    /**
     * Eliminar todas las metas de un usuario
     */
    async deleteByUserId(userId) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            const goals = await this.getByUserId(userId);
            const deletePromises = goals.map(goal => this.delete(goal.id));
            await Promise.all(deletePromises);
            
            console.log(`🗑️ ${goals.length} metas eliminadas para usuario ${userId}`);
            return true;
        } catch (error) {
            console.error('❌ Error en GoalRepository.deleteByUserId:', error);
            throw error;
        }
    },

    /**
     * Obtener estadísticas de metas
     */
    async getStats(userId) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            const q = query(
                collection(db, GOALS_COLLECTION),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            
            const stats = {
                total: 0,
                completed: 0,
                inProgress: 0,
                pending: 0,
                abandoned: 0,
                totalObjectives: 0,
                completedObjectives: 0,
                byCategory: {}
            };
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                stats.total++;
                
                switch (data.status) {
                    case 'completed':
                        stats.completed++;
                        break;
                    case 'in_progress':
                        stats.inProgress++;
                        break;
                    case 'pending':
                        stats.pending++;
                        break;
                    case 'abandoned':
                        stats.abandoned++;
                        break;
                }
                
                // Por categoría
                const category = data.category || 'personal';
                if (!stats.byCategory[category]) {
                    stats.byCategory[category] = { total: 0, completed: 0 };
                }
                stats.byCategory[category].total++;
                if (data.completed) {
                    stats.byCategory[category].completed++;
                }
                
                stats.totalObjectives += (data.objectives || []).length;
                stats.completedObjectives += (data.completedObjectives || 0);
            });
            
            console.log('📊 Estadísticas de metas calculadas:', stats);
            return stats;
        } catch (error) {
            console.error('❌ Error en GoalRepository.getStats:', error);
            throw error;
        }
    }
};