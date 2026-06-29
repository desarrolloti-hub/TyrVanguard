/* ========================================
   GOAL SERVICE - Reglas de negocio
   ======================================== */

import { Goal, GOAL_CATEGORIES, GOAL_STATUS } from '../classes/goalModel.js';
import { GoalRepository } from '../repositories/goalRepository.js';
import { CacheService, STORES } from '../services/cacheService.js';

export { GOAL_CATEGORIES, GOAL_STATUS };

export const GoalService = {
    /**
     * Crear nueva meta
     */
    async createGoal(userId, goalData) {
        console.log('🎯 GoalService.createGoal - Iniciando...');
        console.log('👤 userId:', userId);
        console.log('📦 goalData:', goalData);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }

        // Crear instancia de meta
        const goal = new Goal({
            userId: userId,
            title: goalData.title,
            category: goalData.category,
            description: goalData.description || '',
            objectives: goalData.objectives || [],
            status: GOAL_STATUS.PENDING,
            battleId: goalData.battleId || null
        });

        console.log('📦 Goal instance creada:', goal);

        // Validar datos
        const validation = goal.validateForCreation();
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Generar ID
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        goal.id = `goal_${timestamp}_${random}`;
        
        console.log('🆔 ID generado para la meta:', goal.id);

        // Guardar en Firestore
        const result = await GoalRepository.save(goal.toFirestore());

        console.log('✅ Meta guardada exitosamente:', result);

        // Limpiar cache
        await CacheService.clearCache(STORES.GOALS);

        return new Goal(result);
    },

    /**
     * Obtener meta por ID (con cache)
     */
    async getGoalById(goalId) {
        console.log(`🔍 Buscando meta ${goalId}...`);
        
        if (!goalId) {
            throw new Error('El ID de la meta es obligatorio');
        }
        
        // Intentar cache primero
        const cached = await CacheService.getCache(STORES.GOALS, goalId);
        if (cached) {
            console.log('📦 Datos desde cache');
            return new Goal(cached);
        }

        const goalData = await GoalRepository.getById(goalId);
        if (!goalData) {
            console.log('❌ Meta no encontrada');
            return null;
        }

        const goal = new Goal(goalData);
        
        // Cachear por 1 hora
        await CacheService.setCache(STORES.GOALS, goalId, goal.toFirestore(), 3600000);
        
        console.log('✅ Meta encontrada');
        return goal;
    },

    /**
     * Obtener todas las metas de un usuario
     */
    async getUserGoals(userId, filters = {}) {
        console.log(`📋 Obteniendo metas de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const goalsData = await GoalRepository.getByUserId(userId, filters);
        const goals = goalsData.map(data => new Goal(data));
        
        console.log(`✅ ${goals.length} metas encontradas`);
        return goals;
    },

    /**
     * Obtener metas activas de un usuario
     */
    async getActiveGoals(userId) {
        console.log(`🎯 Obteniendo metas activas de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const goalsData = await GoalRepository.getByUserId(userId, {
            status: ['pending', 'in_progress']
        });
        const goals = goalsData.map(data => new Goal(data));
        
        console.log(`✅ ${goals.length} metas activas encontradas`);
        return goals;
    },

    /**
     * Iniciar meta
     */
    async startGoal(goalId) {
        console.log(`▶️ Iniciando meta ${goalId}...`);
        
        if (!goalId) {
            throw new Error('El ID de la meta es obligatorio');
        }
        
        const goal = await this.getGoalById(goalId);
        if (!goal) {
            throw new Error('Meta no encontrada');
        }

        if (goal.status === GOAL_STATUS.COMPLETED) {
            throw new Error('No puedes iniciar una meta ya completada');
        }

        goal.start();
        const result = await GoalRepository.update(goalId, goal.toFirestore());
        
        await CacheService.clearCache(STORES.GOALS);
        
        console.log('✅ Meta iniciada');
        return new Goal(result);
    },

    /**
     * Completar meta
     */
    async completeGoal(goalId) {
        console.log(`✅ Completando meta ${goalId}...`);
        
        if (!goalId) {
            throw new Error('El ID de la meta es obligatorio');
        }
        
        const goal = await this.getGoalById(goalId);
        if (!goal) {
            throw new Error('Meta no encontrada');
        }

        if (goal.status === GOAL_STATUS.COMPLETED) {
            throw new Error('La meta ya está completada');
        }

        goal.complete();
        const result = await GoalRepository.update(goalId, goal.toFirestore());
        
        await CacheService.clearCache(STORES.GOALS);
        
        console.log('🏆 Meta completada');
        return new Goal(result);
    },

    /**
     * Abandonar meta
     */
    async abandonGoal(goalId) {
        console.log(`🚫 Abandonando meta ${goalId}...`);
        
        if (!goalId) {
            throw new Error('El ID de la meta es obligatorio');
        }
        
        const goal = await this.getGoalById(goalId);
        if (!goal) {
            throw new Error('Meta no encontrada');
        }

        if (goal.status === GOAL_STATUS.COMPLETED) {
            throw new Error('No puedes abandonar una meta completada');
        }

        goal.abandon();
        const result = await GoalRepository.update(goalId, goal.toFirestore());
        
        await CacheService.clearCache(STORES.GOALS);
        
        console.log('🚫 Meta abandonada');
        return new Goal(result);
    },

    /**
     * Completar un objetivo específico
     */
    async completeObjective(goalId, objectiveIndex) {
        console.log(`🎯 Completando objetivo ${objectiveIndex} de meta ${goalId}...`);
        
        if (!goalId) {
            throw new Error('El ID de la meta es obligatorio');
        }
        
        const goal = await this.getGoalById(goalId);
        if (!goal) {
            throw new Error('Meta no encontrada');
        }

        goal.completeObjective(objectiveIndex);
        const result = await GoalRepository.update(goalId, goal.toFirestore());
        
        await CacheService.clearCache(STORES.GOALS);
        
        console.log('✅ Objetivo completado');
        return new Goal(result);
    },

    /**
     * Agregar objetivo a meta
     */
    async addObjectiveToGoal(goalId, objectiveText) {
        console.log(`📝 Agregando objetivo a meta ${goalId}...`);
        
        if (!goalId) {
            throw new Error('El ID de la meta es obligatorio');
        }
        
        const goal = await this.getGoalById(goalId);
        if (!goal) {
            throw new Error('Meta no encontrada');
        }

        goal.addObjective(objectiveText);
        const result = await GoalRepository.update(goalId, goal.toFirestore());
        
        await CacheService.clearCache(STORES.GOALS);
        
        console.log('✅ Objetivo agregado');
        return new Goal(result);
    },

    /**
     * Eliminar objetivo de meta
     */
    async removeObjectiveFromGoal(goalId, objectiveIndex) {
        console.log(`🗑️ Eliminando objetivo ${objectiveIndex} de meta ${goalId}...`);
        
        if (!goalId) {
            throw new Error('El ID de la meta es obligatorio');
        }
        
        const goal = await this.getGoalById(goalId);
        if (!goal) {
            throw new Error('Meta no encontrada');
        }

        goal.removeObjective(objectiveIndex);
        const result = await GoalRepository.update(goalId, goal.toFirestore());
        
        await CacheService.clearCache(STORES.GOALS);
        
        console.log('✅ Objetivo eliminado');
        return new Goal(result);
    },

    /**
     * Eliminar meta
     */
    async deleteGoal(goalId) {
        console.log(`🗑️ Eliminando meta ${goalId}...`);
        
        if (!goalId) {
            throw new Error('El ID de la meta es obligatorio');
        }
        
        const goal = await this.getGoalById(goalId);
        if (!goal) {
            throw new Error('Meta no encontrada');
        }

        if (goal.status === GOAL_STATUS.IN_PROGRESS) {
            throw new Error('No puedes eliminar una meta en curso');
        }

        const result = await GoalRepository.delete(goalId);
        
        await CacheService.clearCache(STORES.GOALS);
        
        console.log('✅ Meta eliminada');
        return result;
    },

    /**
     * Obtener estadísticas de metas
     */
    async getGoalStats(userId) {
        console.log(`📊 Obteniendo estadísticas de metas de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const stats = await GoalRepository.getStats(userId);
        
        console.log('✅ Estadísticas calculadas:', stats);
        return stats;
    },

    /**
     * Obtener resumen de metas
     */
    async getGoalSummary(userId) {
        console.log(`📋 Generando resumen de metas de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const goals = await this.getUserGoals(userId);
        
        const summary = {
            total: goals.length,
            active: goals.filter(g => g.isActive).length,
            completed: goals.filter(g => g.isCompleted).length,
            abandoned: goals.filter(g => g.status === GOAL_STATUS.ABANDONED).length,
            totalObjectives: goals.reduce((acc, g) => acc + g.objectiveCount, 0),
            completedObjectives: goals.reduce((acc, g) => acc + g.completedObjectives, 0),
            byCategory: {},
            recent: goals.slice(0, 5).map(g => g.summary)
        };

        // Agrupar por categoría
        goals.forEach(goal => {
            const category = goal.category;
            if (!summary.byCategory[category]) {
                summary.byCategory[category] = { total: 0, completed: 0 };
            }
            summary.byCategory[category].total++;
            if (goal.isCompleted) {
                summary.byCategory[category].completed++;
            }
        });

        console.log('✅ Resumen generado:', summary);
        return summary;
    }
};