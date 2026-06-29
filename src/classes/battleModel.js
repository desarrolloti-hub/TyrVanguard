/* ========================================
   BATTLE MODEL - Estructura de datos de batalla
   ======================================== */

export const BATTLE_TYPES = {
    FISICO: 'physical',
    MENTAL: 'mental',
    ESPIRITUAL: 'spiritual',
    SOCIAL: 'social',
    CREATIVO: 'creative'
};

export const BATTLE_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned',
    FAILED: 'failed'
};

export const DURATION_UNITS = {
    MINUTES: 'minutes',
    HOURS: 'hours'
};

export class Battle {
    constructor(data = {}) {
        // Identificación
        this.id = data.id || null;
        this.userId = data.userId || null;
        
        // Datos principales
        this.name = data.name || '';
        this.type = data.type || BATTLE_TYPES.FISICO;
        this.description = data.description || '';
        
        // Duración
        this.duration = data.duration || 30;
        this.durationUnit = data.durationUnit || DURATION_UNITS.MINUTES;
        
        // Metas
        this.goals = data.goals || [];
        
        // Estado
        this.status = data.status || BATTLE_STATUS.PENDING;
        this.completed = data.completed || false;
        this.completedAt = data.completedAt || null;
        
        // Fechas
        this.createdAt = data.createdAt || new Date().toISOString();
        this.startedAt = data.startedAt || null;
        this.updatedAt = data.updatedAt || null;
        
        // Progreso
        this.progress = data.progress || 0;
        this.completedGoals = data.completedGoals || 0;
    }

    // ========== GETTERS ==========

    get durationText() {
        const unitLabel = this.durationUnit === DURATION_UNITS.HOURS ? 'horas' : 'minutos';
        return `${this.duration} ${unitLabel}`;
    }

    get typeLabel() {
        const labels = {
            [BATTLE_TYPES.FISICO]: 'Físico',
            [BATTLE_TYPES.MENTAL]: 'Mental',
            [BATTLE_TYPES.ESPIRITUAL]: 'Espiritual',
            [BATTLE_TYPES.SOCIAL]: 'Social',
            [BATTLE_TYPES.CREATIVO]: 'Creativo'
        };
        return labels[this.type] || this.type;
    }

    get statusLabel() {
        const labels = {
            [BATTLE_STATUS.PENDING]: 'Pendiente',
            [BATTLE_STATUS.IN_PROGRESS]: 'En Curso',
            [BATTLE_STATUS.COMPLETED]: 'Completada',
            [BATTLE_STATUS.ABANDONED]: 'Abandonada',
            [BATTLE_STATUS.FAILED]: 'Fallida'
        };
        return labels[this.status] || this.status;
    }

    get statusIcon() {
        const icons = {
            [BATTLE_STATUS.PENDING]: 'fa-clock',
            [BATTLE_STATUS.IN_PROGRESS]: 'fa-spinner',
            [BATTLE_STATUS.COMPLETED]: 'fa-check-circle',
            [BATTLE_STATUS.ABANDONED]: 'fa-times-circle',
            [BATTLE_STATUS.FAILED]: 'fa-skull'
        };
        return icons[this.status] || 'fa-circle';
    }

    get isActive() {
        return this.status === BATTLE_STATUS.IN_PROGRESS || 
               this.status === BATTLE_STATUS.PENDING;
    }

    get isCompleted() {
        return this.status === BATTLE_STATUS.COMPLETED;
    }

    get goalCount() {
        return this.goals.length;
    }

    get progressPercentage() {
        if (this.goalCount === 0) return 0;
        return Math.round((this.completedGoals / this.goalCount) * 100);
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
            name: this.name,
            type: this.type,
            typeLabel: this.typeLabel,
            description: this.description,
            duration: this.duration,
            durationUnit: this.durationUnit,
            durationText: this.durationText,
            goals: this.goals,
            status: this.status,
            statusLabel: this.statusLabel,
            statusIcon: this.statusIcon,
            completed: this.completed,
            progress: this.progress,
            completedGoals: this.completedGoals,
            goalCount: this.goalCount,
            progressPercentage: this.progressPercentage,
            formattedDate: this.formattedDate
        };
    }

    // ========== MÉTODOS ==========

    start() {
        if (this.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('No puedes iniciar una batalla ya completada');
        }
        this.status = BATTLE_STATUS.IN_PROGRESS;
        this.startedAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        return this;
    }

    complete() {
        if (this.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('La batalla ya está completada');
        }
        this.status = BATTLE_STATUS.COMPLETED;
        this.completed = true;
        this.completedAt = new Date().toISOString();
        this.progress = 100;
        this.completedGoals = this.goalCount;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    abandon() {
        if (this.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('No puedes abandonar una batalla completada');
        }
        this.status = BATTLE_STATUS.ABANDONED;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    fail() {
        if (this.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('No puedes marcar como fallida una batalla completada');
        }
        this.status = BATTLE_STATUS.FAILED;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    updateProgress(completedGoals) {
        if (this.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('No puedes actualizar una batalla completada');
        }
        if (completedGoals < 0 || completedGoals > this.goalCount) {
            throw new Error('Número de metas completadas inválido');
        }
        this.completedGoals = completedGoals;
        this.progress = this.goalCount > 0 
            ? Math.round((completedGoals / this.goalCount) * 100) 
            : 0;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    completeGoal(index) {
        if (index < 0 || index >= this.goals.length) {
            throw new Error('Índice de meta inválido');
        }
        if (this.status === BATTLE_STATUS.COMPLETED) {
            throw new Error('No puedes modificar una batalla completada');
        }
        const newCompleted = Math.min(this.completedGoals + 1, this.goalCount);
        this.updateProgress(newCompleted);
        return this;
    }

    validateForCreation() {
        const errors = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }
        if (!this.type || !Object.values(BATTLE_TYPES).includes(this.type)) {
            errors.push('Tipo de batalla inválido');
        }
        if (!this.duration || this.duration < 1) {
            errors.push('La duración debe ser mayor a 0');
        }
        if (this.duration > 480 && this.durationUnit === DURATION_UNITS.MINUTES) {
            errors.push('La duración no puede exceder las 8 horas (480 minutos)');
        }
        if (this.duration > 8 && this.durationUnit === DURATION_UNITS.HOURS) {
            errors.push('La duración no puede exceder las 8 horas');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ========== UTILIDADES ==========

    /**
     * ✅ CORREGIDO: Convertir a objeto para Firestore INCLUYENDO el ID
     */
    toFirestore() {
        return {
            id: this.id, // ✅ AHORA INCLUYE EL ID
            userId: this.userId,
            name: this.name,
            type: this.type,
            description: this.description,
            duration: this.duration,
            durationUnit: this.durationUnit,
            goals: this.goals,
            status: this.status,
            completed: this.completed,
            completedAt: this.completedAt,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            updatedAt: this.updatedAt,
            progress: this.progress,
            completedGoals: this.completedGoals
        };
    }

    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}