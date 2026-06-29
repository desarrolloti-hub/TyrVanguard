/* ========================================
   BATTLE REPOSITORY - Operaciones CRUD en Firebase
   ======================================== */

import { db } from '../../config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const BATTLES_COLLECTION = 'battles';

export const BattleRepository = {
    /**
     * Guardar batalla en Firestore
     */
    async save(battleData) {
        try {
            console.log('💾 BattleRepository.save - Datos recibidos:', battleData);
            
            // ✅ VALIDAR QUE TENGA ID
            if (!battleData || !battleData.id) {
                console.error('❌ Error: battleData.id es undefined o null');
                console.error('📦 battleData:', battleData);
                throw new Error('El ID de la batalla es obligatorio');
            }

            // Crear referencia al documento
            const battleRef = doc(db, BATTLES_COLLECTION, battleData.id);
            console.log('📁 Referencia creada:', `battles/${battleData.id}`);
            
            // Guardar en Firestore
            await setDoc(battleRef, battleData);
            
            console.log('✅ Batalla guardada exitosamente en:', `battles/${battleData.id}`);
            
            return { id: battleData.id, ...battleData };
        } catch (error) {
            console.error('❌ Error en BattleRepository.save:', error);
            throw error;
        }
    },

    /**
     * Obtener batalla por ID
     */
    async getById(battleId) {
        try {
            if (!battleId) {
                throw new Error('El ID de la batalla es obligatorio');
            }
            
            const battleRef = doc(db, BATTLES_COLLECTION, battleId);
            const docSnap = await getDoc(battleRef);
            
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error en BattleRepository.getById:', error);
            throw error;
        }
    },

    /**
     * Obtener batallas por usuario
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
            if (filters.type) {
                constraints.push(where('type', '==', filters.type));
            }
            if (filters.completed !== undefined) {
                constraints.push(where('completed', '==', filters.completed));
            }
            
            // Ordenamiento
            if (filters.orderBy) {
                constraints.push(orderBy(filters.orderBy.field, filters.orderBy.direction || 'desc'));
            } else {
                constraints.push(orderBy('createdAt', 'desc'));
            }
            
            // Límite
            if (filters.limit) {
                constraints.push(limit(filters.limit));
            }

            const q = query(collection(db, BATTLES_COLLECTION), ...constraints);
            const querySnapshot = await getDocs(q);
            
            const battles = [];
            querySnapshot.forEach((doc) => {
                battles.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`📋 ${battles.length} batallas encontradas para usuario ${userId}`);
            return battles;
        } catch (error) {
            console.error('❌ Error en BattleRepository.getByUserId:', error);
            throw error;
        }
    },

    /**
     * Obtener batallas activas (pendientes o en curso) de un usuario
     */
    async getActiveByUserId(userId) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            const q = query(
                collection(db, BATTLES_COLLECTION),
                where('userId', '==', userId),
                where('status', 'in', ['pending', 'in_progress']),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            
            const battles = [];
            querySnapshot.forEach((doc) => {
                battles.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`⚔️ ${battles.length} batallas activas encontradas`);
            return battles;
        } catch (error) {
            console.error('❌ Error en BattleRepository.getActiveByUserId:', error);
            throw error;
        }
    },

    /**
     * Actualizar batalla
     */
    async update(battleId, updateData) {
        try {
            if (!battleId) {
                throw new Error('El ID de la batalla es obligatorio');
            }
            
            const battleRef = doc(db, BATTLES_COLLECTION, battleId);
            
            // Agregar timestamp de actualización
            const dataToUpdate = {
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            await updateDoc(battleRef, dataToUpdate);
            
            console.log(`🔄 Batalla ${battleId} actualizada`);
            
            // Retornar los datos actualizados
            return await this.getById(battleId);
        } catch (error) {
            console.error('❌ Error en BattleRepository.update:', error);
            throw error;
        }
    },

    /**
     * Eliminar batalla
     */
    async delete(battleId) {
        try {
            if (!battleId) {
                throw new Error('El ID de la batalla es obligatorio');
            }
            
            const battleRef = doc(db, BATTLES_COLLECTION, battleId);
            await deleteDoc(battleRef);
            
            console.log(`🗑️ Batalla ${battleId} eliminada`);
            return true;
        } catch (error) {
            console.error('❌ Error en BattleRepository.delete:', error);
            throw error;
        }
    },

    /**
     * Eliminar todas las batallas de un usuario
     */
    async deleteByUserId(userId) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            const battles = await this.getByUserId(userId);
            const deletePromises = battles.map(battle => this.delete(battle.id));
            await Promise.all(deletePromises);
            
            console.log(`🗑️ ${battles.length} batallas eliminadas para usuario ${userId}`);
            return true;
        } catch (error) {
            console.error('❌ Error en BattleRepository.deleteByUserId:', error);
            throw error;
        }
    },

    /**
     * Contar batallas por estado
     */
    async countByStatus(userId) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            const statuses = ['pending', 'in_progress', 'completed', 'abandoned', 'failed'];
            const counts = {};
            
            for (const status of statuses) {
                const q = query(
                    collection(db, BATTLES_COLLECTION),
                    where('userId', '==', userId),
                    where('status', '==', status)
                );
                const snapshot = await getDocs(q);
                counts[status] = snapshot.size;
            }
            
            return counts;
        } catch (error) {
            console.error('❌ Error en BattleRepository.countByStatus:', error);
            throw error;
        }
    },

    /**
     * Obtener estadísticas de batallas de un usuario
     */
    async getStats(userId) {
        try {
            if (!userId) {
                throw new Error('El ID de usuario es obligatorio');
            }
            
            const q = query(
                collection(db, BATTLES_COLLECTION),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            
            const stats = {
                total: 0,
                completed: 0,
                inProgress: 0,
                pending: 0,
                abandoned: 0,
                failed: 0,
                totalGoals: 0,
                completedGoals: 0
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
                    case 'failed':
                        stats.failed++;
                        break;
                }
                
                stats.totalGoals += (data.goals || []).length;
                stats.completedGoals += (data.completedGoals || 0);
            });
            
            console.log('📊 Estadísticas calculadas:', stats);
            return stats;
        } catch (error) {
            console.error('❌ Error en BattleRepository.getStats:', error);
            throw error;
        }
    },

    /**
     * Manejar errores
     */
    _handleError(error) {
        console.error('Error en BattleRepository:', error);
        throw error;
    }
};