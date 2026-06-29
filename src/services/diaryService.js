/* ========================================
   DIARY SERVICE - Reglas de negocio
   ======================================== */

import { Diary, DIARY_TAGS } from '../classes/diaryModel.js';
import { DiaryRepository } from '../repositories/diaryRepository.js';
import { CacheService, STORES } from '../services/cacheService.js';

export { DIARY_TAGS };

export const DiaryService = {
    /**
     * Crear nueva entrada
     */
    async createEntry(userId, entryData) {
        console.log('✍️ DiaryService.createEntry - Iniciando...');
        console.log('👤 userId:', userId);
        console.log('📦 entryData:', entryData);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }

        // Crear instancia de entrada
        const entry = new Diary({
            userId: userId,
            title: entryData.title,
            content: entryData.content,
            tag: entryData.tag || DIARY_TAGS.REFLEXION,
            date: entryData.date || new Date().toISOString(),
            battleId: entryData.battleId || null,
            goalId: entryData.goalId || null
        });

        console.log('📦 Diary instance creada:', entry);

        // Validar datos
        const validation = entry.validateForCreation();
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Generar ID
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        entry.id = `diary_${timestamp}_${random}`;
        
        console.log('🆔 ID generado para la entrada:', entry.id);

        // Guardar en Firestore
        const result = await DiaryRepository.save(entry.toFirestore());

        console.log('✅ Entrada guardada exitosamente:', result);

        // Limpiar cache
        await CacheService.clearCache(STORES.DIARY);

        return new Diary(result);
    },

    /**
     * Obtener entrada por ID (con cache)
     */
    async getEntryById(entryId) {
        console.log(`🔍 Buscando entrada ${entryId}...`);
        
        if (!entryId) {
            throw new Error('El ID de la entrada es obligatorio');
        }
        
        // Intentar cache primero
        const cached = await CacheService.getCache(STORES.DIARY, entryId);
        if (cached) {
            console.log('📦 Datos desde cache');
            return new Diary(cached);
        }

        const entryData = await DiaryRepository.getById(entryId);
        if (!entryData) {
            console.log('❌ Entrada no encontrada');
            return null;
        }

        const entry = new Diary(entryData);
        
        // Cachear por 1 hora
        await CacheService.setCache(STORES.DIARY, entryId, entry.toFirestore(), 3600000);
        
        console.log('✅ Entrada encontrada');
        return entry;
    },

    /**
     * Obtener todas las entradas de un usuario
     */
    async getUserEntries(userId, filters = {}) {
        console.log(`📋 Obteniendo entradas de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const entriesData = await DiaryRepository.getByUserId(userId, filters);
        const entries = entriesData.map(data => new Diary(data));
        
        console.log(`✅ ${entries.length} entradas encontradas`);
        return entries;
    },

    /**
     * Obtener entradas recientes
     */
    async getRecentEntries(userId, limit = 5) {
        console.log(`📋 Obteniendo entradas recientes de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const entriesData = await DiaryRepository.getRecent(userId, limit);
        const entries = entriesData.map(data => new Diary(data));
        
        console.log(`✅ ${entries.length} entradas recientes encontradas`);
        return entries;
    },

    /**
     * Actualizar entrada
     */
    async updateEntry(entryId, updateData) {
        console.log(`✏️ Actualizando entrada ${entryId}...`);
        
        if (!entryId) {
            throw new Error('El ID de la entrada es obligatorio');
        }
        
        const entry = await this.getEntryById(entryId);
        if (!entry) {
            throw new Error('Entrada no encontrada');
        }

        entry.update(updateData);
        const result = await DiaryRepository.update(entryId, entry.toFirestore());
        
        await CacheService.clearCache(STORES.DIARY);
        
        console.log('✅ Entrada actualizada');
        return new Diary(result);
    },

    /**
     * Eliminar entrada
     */
    async deleteEntry(entryId) {
        console.log(`🗑️ Eliminando entrada ${entryId}...`);
        
        if (!entryId) {
            throw new Error('El ID de la entrada es obligatorio');
        }
        
        const entry = await this.getEntryById(entryId);
        if (!entry) {
            throw new Error('Entrada no encontrada');
        }

        const result = await DiaryRepository.delete(entryId);
        
        await CacheService.clearCache(STORES.DIARY);
        
        console.log('✅ Entrada eliminada');
        return result;
    },

    /**
     * Obtener estadísticas de diario
     */
    async getDiaryStats(userId) {
        console.log(`📊 Obteniendo estadísticas de diario de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const stats = await DiaryRepository.getStats(userId);
        
        console.log('✅ Estadísticas calculadas:', stats);
        return stats;
    },

    /**
     * Obtener resumen del diario
     */
    async getDiarySummary(userId) {
        console.log(`📋 Generando resumen de diario de usuario ${userId}...`);
        
        if (!userId) {
            throw new Error('El ID de usuario es obligatorio');
        }
        
        const entries = await this.getUserEntries(userId);
        
        const summary = {
            total: entries.length,
            byTag: {},
            recent: entries.slice(0, 5).map(e => e.summary)
        };

        // Agrupar por etiqueta
        entries.forEach(entry => {
            const tag = entry.tag;
            if (!summary.byTag[tag]) {
                summary.byTag[tag] = 0;
            }
            summary.byTag[tag]++;
        });

        console.log('✅ Resumen generado:', summary);
        return summary;
    }
};