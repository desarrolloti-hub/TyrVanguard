/* ========================================
   ACTIVITY SERVICE - Reglas de negocio
   ======================================== */

import { Activity, ACTIVITY_CATEGORIES, ACTIVITY_DIFFICULTY, ACTIVITY_STATUS } from '../classes/activityModel.js';
import { ActivityRepository } from '../repositories/activityRepository.js';
import { CacheService, STORES } from '../services/cacheService.js';

export { ACTIVITY_CATEGORIES, ACTIVITY_DIFFICULTY, ACTIVITY_STATUS };

export const ActivityService = {
    /**
     * Crear nueva actividad
     */
    async createActivity(adminId, activityData) {
        console.log('🏋️ ActivityService.createActivity - Iniciando...');
        console.log('👤 adminId:', adminId);
        console.log('📦 activityData:', activityData);
        
        if (!adminId) {
            throw new Error('El ID del administrador es obligatorio');
        }

        // Crear instancia de actividad
        const activity = new Activity({
            createdBy: adminId,
            title: activityData.title,
            description: activityData.description,
            category: activityData.category,
            difficulty: activityData.difficulty,
            duration: activityData.duration,
            benefits: activityData.benefits || [],
            steps: activityData.steps || [],
            resources: activityData.resources || [],
            tags: activityData.tags || [],
            imageURL: activityData.imageURL || '',
            isActive: activityData.isActive !== undefined ? activityData.isActive : true
        });

        console.log('📦 Activity instance creada:', activity);

        // Validar datos
        const validation = activity.validateForCreation();
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Generar ID
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        activity.id = `activity_${timestamp}_${random}`;
        
        console.log('🆔 ID generado para la actividad:', activity.id);

        // Guardar en Firestore
        const result = await ActivityRepository.save(activity.toFirestore());

        console.log('✅ Actividad guardada exitosamente:', result);

        // Limpiar cache
        await CacheService.clearCache(STORES.ACTIVITIES);

        return new Activity(result);
    },

    /**
     * Obtener actividad por ID (con cache)
     */
    async getActivityById(activityId) {
        console.log(`🔍 Buscando actividad ${activityId}...`);
        
        if (!activityId) {
            throw new Error('El ID de la actividad es obligatorio');
        }
        
        // Intentar cache primero
        const cached = await CacheService.getCache(STORES.ACTIVITIES, activityId);
        if (cached) {
            console.log('📦 Datos desde cache');
            return new Activity(cached);
        }

        const activityData = await ActivityRepository.getById(activityId);
        if (!activityData) {
            console.log('❌ Actividad no encontrada');
            return null;
        }

        const activity = new Activity(activityData);
        
        // Cachear por 1 hora
        await CacheService.setCache(STORES.ACTIVITIES, activityId, activity.toFirestore(), 3600000);
        
        console.log('✅ Actividad encontrada');
        return activity;
    },

    /**
     * Obtener todas las actividades activas
     */
    async getActiveActivities(filters = {}) {
        console.log('📋 Obteniendo actividades activas...');
        
        const activitiesData = await ActivityRepository.getActive(filters);
        const activities = activitiesData.map(data => new Activity(data));
        
        console.log(`✅ ${activities.length} actividades activas encontradas`);
        return activities;
    },

    /**
     * Obtener todas las actividades (admin)
     */
    async getAllActivities(filters = {}) {
        console.log('📋 Obteniendo todas las actividades...');
        
        const activitiesData = await ActivityRepository.getAll(filters);
        const activities = activitiesData.map(data => new Activity(data));
        
        console.log(`✅ ${activities.length} actividades encontradas`);
        return activities;
    },

    /**
     * Actualizar actividad
     */
    async updateActivity(activityId, updateData) {
        console.log(`🔄 Actualizando actividad ${activityId}...`);
        
        if (!activityId) {
            throw new Error('El ID de la actividad es obligatorio');
        }
        
        // Obtener actividad actual
        const activity = await this.getActivityById(activityId);
        if (!activity) {
            throw new Error('Actividad no encontrada');
        }

        // Actualizar campos permitidos
        const allowedFields = ['title', 'description', 'category', 'difficulty', 'duration', 'benefits', 'steps', 'resources', 'tags', 'imageURL', 'isActive'];
        let hasChanges = false;
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                activity[field] = updateData[field];
                hasChanges = true;
            }
        }

        if (!hasChanges) {
            throw new Error('No hay datos válidos para actualizar');
        }

        activity.updatedAt = new Date().toISOString();
        
        const result = await ActivityRepository.update(activityId, activity.toFirestore());
        
        await CacheService.clearCache(STORES.ACTIVITIES);
        
        console.log('✅ Actividad actualizada');
        return new Activity(result);
    },

    /**
     * Activar actividad
     */
    async activateActivity(activityId) {
        console.log(`▶️ Activando actividad ${activityId}...`);
        
        if (!activityId) {
            throw new Error('El ID de la actividad es obligatorio');
        }
        
        const activity = await this.getActivityById(activityId);
        if (!activity) {
            throw new Error('Actividad no encontrada');
        }

        activity.activate();
        const result = await ActivityRepository.update(activityId, activity.toFirestore());
        
        await CacheService.clearCache(STORES.ACTIVITIES);
        
        console.log('✅ Actividad activada');
        return new Activity(result);
    },

    /**
     * Desactivar actividad
     */
    async deactivateActivity(activityId) {
        console.log(`⏸️ Desactivando actividad ${activityId}...`);
        
        if (!activityId) {
            throw new Error('El ID de la actividad es obligatorio');
        }
        
        const activity = await this.getActivityById(activityId);
        if (!activity) {
            throw new Error('Actividad no encontrada');
        }

        activity.deactivate();
        const result = await ActivityRepository.update(activityId, activity.toFirestore());
        
        await CacheService.clearCache(STORES.ACTIVITIES);
        
        console.log('✅ Actividad desactivada');
        return new Activity(result);
    },

    /**
     * Incrementar contador de completados
     */
    async incrementCompleted(activityId) {
        console.log(`📈 Incrementando completados de actividad ${activityId}...`);
        
        if (!activityId) {
            throw new Error('El ID de la actividad es obligatorio');
        }
        
        const activity = await this.getActivityById(activityId);
        if (!activity) {
            throw new Error('Actividad no encontrada');
        }

        activity.incrementCompleted();
        const result = await ActivityRepository.update(activityId, activity.toFirestore());
        
        await CacheService.clearCache(STORES.ACTIVITIES);
        
        console.log('✅ Contador incrementado');
        return new Activity(result);
    },

    /**
     * Eliminar actividad
     */
    async deleteActivity(activityId) {
        console.log(`🗑️ Eliminando actividad ${activityId}...`);
        
        if (!activityId) {
            throw new Error('El ID de la actividad es obligatorio');
        }
        
        const activity = await this.getActivityById(activityId);
        if (!activity) {
            throw new Error('Actividad no encontrada');
        }

        const result = await ActivityRepository.delete(activityId);
        
        await CacheService.clearCache(STORES.ACTIVITIES);
        
        console.log('✅ Actividad eliminada');
        return result;
    },

    /**
     * Obtener estadísticas de actividades
     */
    async getActivityStats() {
        console.log('📊 Obteniendo estadísticas de actividades...');
        
        const stats = await ActivityRepository.getStats();
        
        console.log('✅ Estadísticas calculadas:', stats);
        return stats;
    },

    /**
     * Obtener resumen de actividades
     */
    async getActivitySummary() {
        console.log('📋 Generando resumen de actividades...');
        
        const activities = await this.getAllActivities();
        
        const summary = {
            total: activities.length,
            active: activities.filter(a => a.isActive).length,
            inactive: activities.filter(a => !a.isActive).length,
            totalCompletions: activities.reduce((acc, a) => acc + a.timesCompleted, 0),
            byCategory: {},
            byDifficulty: {},
            recent: activities.slice(0, 5).map(a => a.summary)
        };

        // Agrupar por categoría
        activities.forEach(activity => {
            const category = activity.category;
            if (!summary.byCategory[category]) {
                summary.byCategory[category] = { total: 0, active: 0, completions: 0 };
            }
            summary.byCategory[category].total++;
            if (activity.isActive) {
                summary.byCategory[category].active++;
            }
            summary.byCategory[category].completions += activity.timesCompleted;
        });

        // Agrupar por dificultad
        activities.forEach(activity => {
            const difficulty = activity.difficulty;
            if (!summary.byDifficulty[difficulty]) {
                summary.byDifficulty[difficulty] = { total: 0, active: 0 };
            }
            summary.byDifficulty[difficulty].total++;
            if (activity.isActive) {
                summary.byDifficulty[difficulty].active++;
            }
        });

        console.log('✅ Resumen generado:', summary);
        return summary;
    }
};