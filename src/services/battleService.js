/* ========================================
   BATTLE SERVICE - Reglas de negocio
   ======================================== */

import { Battle, BATTLE_TYPES, BATTLE_STATUS, DURATION_UNITS } from '../classes/battleModel.js';
import { BattleRepository } from '../repositories/battleRepository.js';
import { CacheService, STORES } from '../services/cacheService.js';

export { BATTLE_TYPES, BATTLE_STATUS, DURATION_UNITS };

export const BattleService = {
    /**
     * Crear nueva batalla
     */
    async createBattle(userId, battleData) {
        console.log('🏗️ BattleService.createBattle - Iniciando...');
        console.log('👤 userId:', userId);
        console.log('📦 battleData:', battleData);
        
        // Validaciones
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }

        // Crear instancia de batalla
        const battle = new Battle({
            userId: userId,
            name: battleData.name,
            type: battleData.type,
            description: battleData.description || '',
            duration: battleData.duration,
            durationUnit: battleData.durationUnit || DURATION_UNITS.MINUTES,
            goals: battleData.goals || [],
            status: BATTLE_STATUS.PENDING
        });

        console.log('📦 Battle instance creada:', battle);

        // Validar datos
        const validation = battle.validateForCreation();
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // ✅ GENERAR ID - Asegurar que siempre tenga un valor
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        battle.id = `battle_${timestamp}_${random}`;
        
        console.log('🆔 ID generado para la batalla:', battle.id);
        console.log('📦 Battle con ID:', battle);

        // Obtener datos para Firestore
        const firestoreData = battle.toFirestore();
        console.log('📦 Datos a guardar en Firestore:', firestoreData);

        // Guardar en Firestore
        const result = await BattleRepository.save(firestoreData);

        console.log('✅ Batalla guardada exitosamente:', result);

        // Limpiar cache
        await CacheService.clearCache(STORES.BATTLES);

        return new Battle(result);
    },

    /**
     * Obtener batalla por ID (con cache)
     */
    async getBattleById(battleId) {
        console.log(`🔍 Buscando batalla ${battleId}...`);
        
        if (!battleId) {
            throw new Error('El ID de la batalla es obligatorio');
        }
        
        // Intentar cache primero
        const cached = await CacheService.getCache(STORES.BATTLES, battleId);
        if (cached) {
            console.log('📦 Datos desde cache');
            return new Battle(cached);
        }

        const battleData = await BattleRepository.getById(battleId);
        if (!battleData) {
            console.log('❌ Batalla no encontrada');
            return null;
        }

        const battle = new Battle(battleData);
        
        // Cachear por 1 hora
        await CacheService.setCache(STORES.BATTLES, battleId, battle.toFirestore(), 3600000);
        
        console.log('✅ Batalla encontrada');
        return battle;
    },

    /**
     * Obtener todas las batallas de un usuario
     */
    async getUserBattles(userId, filters = {}) {
        console.log(`📋 Obteniendo batallas de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const battlesData = await BattleRepository.getByUserId(userId, filters);
        const battles = battlesData.map(data => new Battle(data));
        
        console.log(`✅ ${battles.length} batallas encontradas`);
        return battles;
    },

    /**
     * Obtener batallas activas de un usuario
     */
    async getActiveBattles(userId) {
        console.log(`⚔️ Obteniendo batallas activas de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const battlesData = await BattleRepository.getActiveByUserId(userId);
        const battles = battlesData.map(data => new Battle(data));
        
        console.log(`✅ ${battles.length} batallas activas encontradas`);
        return battles;
    },

    /**
     * Iniciar batalla
     */
    async startBattle(battleId) {
        console.log(`▶️ Iniciando batalla ${battleId}...`);
        
        if (!battleId) {
            throw new Error('El ID de la batalla es obligatorio');
        }
        
        const battle = await this.getBattleById(battleId);
        if (!battle) {
            throw new Error('Batalla no encontrada');
        }

        if (battle.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('No puedes iniciar una batalla ya completada');
        }

        battle.start();
        const result = await BattleRepository.update(battleId, battle.toFirestore());
        
        // Limpiar cache
        await CacheService.clearCache(STORES.BATTLES);
        
        console.log('✅ Batalla iniciada');
        return new Battle(result);
    },

    /**
     * Completar batalla
     */
    async completeBattle(battleId) {
        console.log(`✅ Completando batalla ${battleId}...`);
        
        if (!battleId) {
            throw new Error('El ID de la batalla es obligatorio');
        }
        
        const battle = await this.getBattleById(battleId);
        if (!battle) {
            throw new Error('Batalla no encontrada');
        }

        if (battle.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('La batalla ya está completada');
        }

        battle.complete();
        const result = await BattleRepository.update(battleId, battle.toFirestore());
        
        // Limpiar cache
        await CacheService.clearCache(STORES.BATTLES);
        
        console.log('🏆 Batalla completada');
        return new Battle(result);
    },

    /**
     * Abandonar batalla
     */
    async abandonBattle(battleId) {
        console.log(`🚫 Abandonando batalla ${battleId}...`);
        
        if (!battleId) {
            throw new Error('El ID de la batalla es obligatorio');
        }
        
        const battle = await this.getBattleById(battleId);
        if (!battle) {
            throw new Error('Batalla no encontrada');
        }

        if (battle.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('No puedes abandonar una batalla completada');
        }

        battle.abandon();
        const result = await BattleRepository.update(battleId, battle.toFirestore());
        
        // Limpiar cache
        await CacheService.clearCache(STORES.BATTLES);
        
        console.log('🚫 Batalla abandonada');
        return new Battle(result);
    },

    /**
     * Marcar batalla como fallida
     */
    async failBattle(battleId) {
        console.log(`💀 Marcando batalla ${battleId} como fallida...`);
        
        if (!battleId) {
            throw new Error('El ID de la batalla es obligatorio');
        }
        
        const battle = await this.getBattleById(battleId);
        if (!battle) {
            throw new Error('Batalla no encontrada');
        }

        if (battle.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('No puedes marcar como fallida una batalla completada');
        }

        battle.fail();
        const result = await BattleRepository.update(battleId, battle.toFirestore());
        
        // Limpiar cache
        await CacheService.clearCache(STORES.BATTLES);
        
        console.log('💀 Batalla marcada como fallida');
        return new Battle(result);
    },

    /**
     * Actualizar progreso de batalla
     */
    async updateBattleProgress(battleId, completedGoals) {
        console.log(`📊 Actualizando progreso de batalla ${battleId}: ${completedGoals}`);
        
        if (!battleId) {
            throw new Error('El ID de la batalla es obligatorio');
        }
        
        const battle = await this.getBattleById(battleId);
        if (!battle) {
            throw new Error('Batalla no encontrada');
        }

        if (battle.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('No puedes actualizar una batalla completada');
        }

        battle.updateProgress(completedGoals);
        
        // Si todas las metas están completadas, completar automáticamente
        if (battle.completedGoals === battle.goalCount && battle.goalCount > 0) {
            battle.complete();
        }

        const result = await BattleRepository.update(battleId, battle.toFirestore());
        
        // Limpiar cache
        await CacheService.clearCache(STORES.BATTLES);
        
        console.log('✅ Progreso actualizado');
        return new Battle(result);
    },

    /**
     * Marcar una meta específica como completada
     */
    async completeGoal(battleId, goalIndex) {
        console.log(`🎯 Completando meta ${goalIndex} de batalla ${battleId}...`);
        
        if (!battleId) {
            throw new Error('El ID de la batalla es obligatorio');
        }
        
        const battle = await this.getBattleById(battleId);
        if (!battle) {
            throw new Error('Batalla no encontrada');
        }

        battle.completeGoal(goalIndex);
        
        // Si todas las metas están completadas, completar automáticamente
        if (battle.completedGoals === battle.goalCount && battle.goalCount > 0) {
            battle.complete();
        }

        const result = await BattleRepository.update(battleId, battle.toFirestore());
        
        // Limpiar cache
        await CacheService.clearCache(STORES.BATTLES);
        
        console.log('✅ Meta completada');
        return new Battle(result);
    },

    /**
     * Eliminar batalla
     */
    async deleteBattle(battleId) {
        console.log(`🗑️ Eliminando batalla ${battleId}...`);
        
        if (!battleId) {
            throw new Error('El ID de la batalla es obligatorio');
        }
        
        const battle = await this.getBattleById(battleId);
        if (!battle) {
            throw new Error('Batalla no encontrada');
        }

        if (battle.status === BATTLE_STATUS.IN_PROGRESS) {
            throw new Error('No puedes eliminar una batalla en curso');
        }

        const result = await BattleRepository.delete(battleId);
        
        // Limpiar cache
        await CacheService.clearCache(STORES.BATTLES);
        
        console.log('✅ Batalla eliminada');
        return result;
    },

    /**
     * Eliminar todas las batallas de un usuario
     */
    async deleteUserBattles(userId) {
        console.log(`🗑️ Eliminando todas las batallas de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const result = await BattleRepository.deleteByUserId(userId);
        
        // Limpiar cache
        await CacheService.clearCache(STORES.BATTLES);
        
        console.log('✅ Todas las batallas eliminadas');
        return result;
    },

    /**
     * Obtener estadísticas de batallas
     */
    async getBattleStats(userId) {
        console.log(`📊 Obteniendo estadísticas de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const stats = await BattleRepository.getStats(userId);
        
        console.log('✅ Estadísticas calculadas:', stats);
        return stats;
    },

    /**
     * Obtener resumen de batallas por estado
     */
    async getBattleSummary(userId) {
        console.log(`📋 Generando resumen de batallas de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const battles = await this.getUserBattles(userId);
        
        const summary = {
            total: battles.length,
            active: battles.filter(b => b.isActive).length,
            completed: battles.filter(b => b.isCompleted).length,
            abandoned: battles.filter(b => b.status === BATTLE_STATUS.ABANDONED).length,
            failed: battles.filter(b => b.status === BATTLE_STATUS.FAILED).length,
            totalGoals: battles.reduce((acc, b) => acc + b.goalCount, 0),
            completedGoals: battles.reduce((acc, b) => acc + b.completedGoals, 0),
            byType: {},
            recent: battles.slice(0, 5).map(b => b.summary)
        };

        // Agrupar por tipo
        battles.forEach(battle => {
            const type = battle.type;
            if (!summary.byType[type]) {
                summary.byType[type] = { total: 0, completed: 0 };
            }
            summary.byType[type].total++;
            if (battle.isCompleted) {
                summary.byType[type].completed++;
            }
        });

        console.log('✅ Resumen generado:', summary);
        return summary;
    }
};