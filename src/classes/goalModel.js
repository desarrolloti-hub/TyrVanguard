/* ========================================
   GOAL MODEL - Estructura de datos de meta
   ======================================== */

export const GOAL_CATEGORIES = {
    PERSONAL: 'personal',
    PROFESIONAL: 'professional',
    SALUD: 'health',
    ESPIRITUAL: 'spiritual',
    SOCIAL: 'social'
};

export const GOAL_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned'
};

export class Goal {
    constructor(data = {}) {
        // Identificación
        this.id = data.id || null;
        this.userId = data.userId || null;
        
        // Datos principales
        this.title = data.title || '';
        this.category = data.category || GOAL_CATEGORIES.PERSONAL;
        this.description = data.description || '';
        
        // Objetivos (sub-metas)
        this.objectives = data.objectives || []; // Array de { id, text, completed }
        
        // Estado
        this.status = data.status || GOAL_STATUS.PENDING;
        this.completed = data.completed || false;
        this.completedAt = data.completedAt || null;
        
        // Progreso
        this.progress = data.progress || 0; // 0-100
        this.completedObjectives = data.completedObjectives || 0;
        
        // Fechas
        this.createdAt = data.createdAt || new Date().toISOString();
        this.startedAt = data.startedAt || null;
        this.updatedAt = data.updatedAt || null;
        
        // Meta padre (opcional)
        this.battleId = data.battleId || null; // Si pertenece a una batalla
    }

    // ========== GETTERS ==========

    get categoryLabel() {
        const labels = {
            [GOAL_CATEGORIES.PERSONAL]: 'Personal',
            [GOAL_CATEGORIES.PROFESIONAL]: 'Profesional',
            [GOAL_CATEGORIES.SALUD]: 'Salud',
            [GOAL_CATEGORIES.ESPIRITUAL]: 'Espiritual',
            [GOAL_CATEGORIES.SOCIAL]: 'Social'
        };
        return labels[this.category] || this.category;
    }

    get categoryIcon() {
        const icons = {
            [GOAL_CATEGORIES.PERSONAL]: 'fa-user',
            [GOAL_CATEGORIES.PROFESIONAL]: 'fa-briefcase',
            [GOAL_CATEGORIES.SALUD]: 'fa-heart',
            [GOAL_CATEGORIES.ESPIRITUAL]: 'fa-spa',
            [GOAL_CATEGORIES.SOCIAL]: 'fa-users'
        };
        return icons[this.category] || 'fa-tag';
    }

    get statusLabel() {
        const labels = {
            [GOAL_STATUS.PENDING]: 'Pendiente',
            [GOAL_STATUS.IN_PROGRESS]: 'En Curso',
            [GOAL_STATUS.COMPLETED]: 'Completada',
            [GOAL_STATUS.ABANDONED]: 'Abandonada'
        };
        return labels[this.status] || this.status;
    }

    get statusIcon() {
        const icons = {
            [GOAL_STATUS.PENDING]: 'fa-clock',
            [GOAL_STATUS.IN_PROGRESS]: 'fa-spinner',
            [GOAL_STATUS.COMPLETED]: 'fa-check-circle',
            [GOAL_STATUS.ABANDONED]: 'fa-times-circle'
        };
        return icons[this.status] || 'fa-circle';
    }

    get isActive() {
        return this.status === GOAL_STATUS.IN_PROGRESS || 
               this.status === GOAL_STATUS.PENDING;
    }

    get isCompleted() {
        return this.status === GOAL_STATUS.COMPLETED;
    }

    get objectiveCount() {
        return this.objectives.length;
    }

    get progressPercentage() {
        if (this.objectiveCount === 0) return 0;
        return Math.round((this.completedObjectives / this.objectiveCount) * 100);
    }

    get formattedDate() {
        if (!this.createdAt) return '';
        const date = new Date(this.createdAt);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    get summary() {
        return {
            id: this.id,
            userId: this.userId,
            title: this.title,
            category: this.category,
            categoryLabel: this.categoryLabel,
            categoryIcon: this.categoryIcon,
            description: this.description,
            objectives: this.objectives,
            status: this.status,
            statusLabel: this.statusLabel,
            statusIcon: this.statusIcon,
            completed: this.completed,
            progress: this.progress,
            completedObjectives: this.completedObjectives,
            objectiveCount: this.objectiveCount,
            progressPercentage: this.progressPercentage,
            formattedDate: this.formattedDate,
            battleId: this.battleId
        };
    }

    // ========== MÉTODOS ==========

    /**
     * Iniciar la meta
     */
    start() {
        if (this.status === GOAL_STATUS.COMPLETED) {
            throw new Error('No puedes iniciar una meta ya completada');
        }
        this.status = GOAL_STATUS.IN_PROGRESS;
        this.startedAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Completar la meta
     */
    complete() {
        if (this.status === GOAL_STATUS.COMPLETED) {
            throw new Error('La meta ya está completada');
        }
        this.status = GOAL_STATUS.COMPLETED;
        this.completed = true;
        this.completedAt = new Date().toISOString();
        this.progress = 100;
        this.completedObjectives = this.objectiveCount;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Abandonar la meta
     */
    abandon() {
        if (this.status === GOAL_STATUS.COMPLETED) {
            throw new Error('No puedes abandonar una meta completada');
        }
        this.status = GOAL_STATUS.ABANDONED;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Actualizar progreso de objetivos
     */
    updateProgress(completedObjectives) {
        if (this.status === GOAL_STATUS.COMPLETED) {
            throw new Error('No puedes actualizar una meta completada');
        }
        if (completedObjectives < 0 || completedObjectives > this.objectiveCount) {
            throw new Error('Número de objetivos completados inválido');
        }
        this.completedObjectives = completedObjectives;
        this.progress = this.objectiveCount > 0 
            ? Math.round((completedObjectives / this.objectiveCount) * 100) 
            : 0;
        this.updatedAt = new Date().toISOString();
        
        // Si todos los objetivos están completados, completar automáticamente
        if (this.completedObjectives === this.objectiveCount && this.objectiveCount > 0) {
            this.complete();
        }
        
        return this;
    }

    /**
     * Marcar un objetivo específico como completado
     */
    completeObjective(index) {
        if (index < 0 || index >= this.objectives.length) {
            throw new Error('Índice de objetivo inválido');
        }
        if (this.status === GOAL_STATUS.COMPLETED) {
            throw new Error('No puedes modificar una meta completada');
        }
        
        // Marcar el objetivo como completado
        this.objectives[index].completed = true;
        
        // Recalcular progreso
        const completed = this.objectives.filter(obj => obj.completed).length;
        this.updateProgress(completed);
        
        return this;
    }

    /**
     * Agregar un nuevo objetivo
     */
    addObjective(text) {
        if (!text || text.trim().length < 1) {
            throw new Error('El texto del objetivo es obligatorio');
        }
        if (this.status === GOAL_STATUS.COMPLETED) {
            throw new Error('No puedes agregar objetivos a una meta completada');
        }
        
        this.objectives.push({
            id: Date.now() + Math.random(),
            text: text.trim(),
            completed: false
        });
        
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Eliminar un objetivo
     */
    removeObjective(index) {
        if (index < 0 || index >= this.objectives.length) {
            throw new Error('Índice de objetivo inválido');
        }
        if (this.status === GOAL_STATUS.COMPLETED) {
            throw new Error('No puedes eliminar objetivos de una meta completada');
        }
        
        this.objectives.splice(index, 1);
        
        // Recalcular progreso
        const completed = this.objectives.filter(obj => obj.completed).length;
        this.completedObjectives = completed;
        this.progress = this.objectiveCount > 0 
            ? Math.round((completed / this.objectiveCount) * 100) 
            : 0;
        
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Validar datos para creación
     */
    validateForCreation() {
        const errors = [];

        if (!this.title || this.title.trim().length < 2) {
            errors.push('El título debe tener al menos 2 caracteres');
        }
        if (!this.category || !Object.values(GOAL_CATEGORIES).includes(this.category)) {
            errors.push('Categoría inválida');
        }
        if (!this.objectives || this.objectives.length === 0) {
            errors.push('Debes agregar al menos un objetivo');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ========== UTILIDADES ==========

    /**
     * Convertir a objeto para Firestore
     */
    toFirestore() {
        return {
            id: this.id,
            userId: this.userId,
            title: this.title,
            category: this.category,
            description: this.description,
            objectives: this.objectives,
            status: this.status,
            completed: this.completed,
            completedAt: this.completedAt,
            progress: this.progress,
            completedObjectives: this.completedObjectives,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            updatedAt: this.updatedAt,
            battleId: this.battleId
        };
    }
}