/* ========================================
   ACTIVITY MODEL - Estructura de datos de actividad distractora
   ======================================== */

export const ACTIVITY_CATEGORIES = {
    DEPORTE: 'deporte',
    CREATIVIDAD: 'creatividad',
    RELAJACION: 'relajacion',
    SOCIAL: 'social',
    APRENDIZAJE: 'aprendizaje',
    DOMESTICA: 'domestica',
    JUEGO: 'juego',
    OTROS: 'otros'
};

export const ACTIVITY_DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

export const ACTIVITY_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
};

export class Activity {
    constructor(data = {}) {
        // Identificación
        this.id = data.id || null;
        this.createdBy = data.createdBy || null; // ID del admin que la creó
        
        // Datos principales
        this.title = data.title || '';
        this.description = data.description || '';
        this.category = data.category || ACTIVITY_CATEGORIES.OTROS;
        this.difficulty = data.difficulty || ACTIVITY_DIFFICULTY.EASY;
        
        // Métricas
        this.duration = data.duration || 10; // minutos
        this.benefits = data.benefits || []; // Array de strings
        this.steps = data.steps || []; // Array de strings (pasos a seguir)
        this.resources = data.resources || []; // Array de strings (materiales necesarios)
        this.tags = data.tags || []; // Array de strings (etiquetas)
        
        // Imagen
        this.imageURL = data.imageURL || '';
        
        // Estado
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.status = data.isActive ? ACTIVITY_STATUS.ACTIVE : ACTIVITY_STATUS.INACTIVE;
        
        // Estadísticas
        this.timesCompleted = data.timesCompleted || 0; // Cuántas veces se ha completado
        
        // Fechas
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
    }

    // ========== GETTERS ==========

    get categoryLabel() {
        const labels = {
            [ACTIVITY_CATEGORIES.DEPORTE]: 'Deporte y Ejercicio',
            [ACTIVITY_CATEGORIES.CREATIVIDAD]: 'Creatividad',
            [ACTIVITY_CATEGORIES.RELAJACION]: 'Relajación',
            [ACTIVITY_CATEGORIES.SOCIAL]: 'Social',
            [ACTIVITY_CATEGORIES.APRENDIZAJE]: 'Aprendizaje',
            [ACTIVITY_CATEGORIES.DOMESTICA]: 'Doméstica',
            [ACTIVITY_CATEGORIES.JUEGO]: 'Juego',
            [ACTIVITY_CATEGORIES.OTROS]: 'Otros'
        };
        return labels[this.category] || this.category;
    }

    get categoryIcon() {
        const icons = {
            [ACTIVITY_CATEGORIES.DEPORTE]: 'fa-running',
            [ACTIVITY_CATEGORIES.CREATIVIDAD]: 'fa-palette',
            [ACTIVITY_CATEGORIES.RELAJACION]: 'fa-spa',
            [ACTIVITY_CATEGORIES.SOCIAL]: 'fa-users',
            [ACTIVITY_CATEGORIES.APRENDIZAJE]: 'fa-graduation-cap',
            [ACTIVITY_CATEGORIES.DOMESTICA]: 'fa-home',
            [ACTIVITY_CATEGORIES.JUEGO]: 'fa-gamepad',
            [ACTIVITY_CATEGORIES.OTROS]: 'fa-star'
        };
        return icons[this.category] || 'fa-star';
    }

    get difficultyLabel() {
        const labels = {
            [ACTIVITY_DIFFICULTY.EASY]: 'Fácil',
            [ACTIVITY_DIFFICULTY.MEDIUM]: 'Media',
            [ACTIVITY_DIFFICULTY.HARD]: 'Difícil'
        };
        return labels[this.difficulty] || this.difficulty;
    }

    get difficultyIcon() {
        const icons = {
            [ACTIVITY_DIFFICULTY.EASY]: '🟢',
            [ACTIVITY_DIFFICULTY.MEDIUM]: '🟡',
            [ACTIVITY_DIFFICULTY.HARD]: '🔴'
        };
        return icons[this.difficulty] || '⚪';
    }

    get statusLabel() {
        const labels = {
            [ACTIVITY_STATUS.ACTIVE]: 'Activa',
            [ACTIVITY_STATUS.INACTIVE]: 'Inactiva'
        };
        return labels[this.status] || this.status;
    }

    get isActiveStatus() {
        return this.status === ACTIVITY_STATUS.ACTIVE;
    }

    get stepCount() {
        return this.steps.length;
    }

    get formattedDuration() {
        if (this.duration < 60) {
            return `${this.duration} min`;
        }
        const hours = Math.floor(this.duration / 60);
        const minutes = this.duration % 60;
        return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
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
            title: this.title,
            description: this.description,
            category: this.category,
            categoryLabel: this.categoryLabel,
            categoryIcon: this.categoryIcon,
            difficulty: this.difficulty,
            difficultyLabel: this.difficultyLabel,
            difficultyIcon: this.difficultyIcon,
            duration: this.duration,
            formattedDuration: this.formattedDuration,
            benefits: this.benefits,
            steps: this.steps,
            resources: this.resources,
            tags: this.tags,
            imageURL: this.imageURL,
            isActive: this.isActive,
            status: this.status,
            statusLabel: this.statusLabel,
            timesCompleted: this.timesCompleted,
            stepCount: this.stepCount,
            formattedDate: this.formattedDate,
            createdBy: this.createdBy
        };
    }

    // ========== MÉTODOS ==========

    /**
     * Activar actividad
     */
    activate() {
        if (this.isActive) {
            throw new Error('La actividad ya está activa');
        }
        this.isActive = true;
        this.status = ACTIVITY_STATUS.ACTIVE;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Desactivar actividad
     */
    deactivate() {
        if (!this.isActive) {
            throw new Error('La actividad ya está inactiva');
        }
        this.isActive = false;
        this.status = ACTIVITY_STATUS.INACTIVE;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Incrementar contador de completados
     */
    incrementCompleted() {
        this.timesCompleted += 1;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Agregar un beneficio
     */
    addBenefit(benefit) {
        if (!benefit || benefit.trim().length < 1) {
            throw new Error('El beneficio es obligatorio');
        }
        this.benefits.push(benefit.trim());
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Agregar un paso
     */
    addStep(step) {
        if (!step || step.trim().length < 1) {
            throw new Error('El paso es obligatorio');
        }
        this.steps.push(step.trim());
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Agregar un recurso
     */
    addResource(resource) {
        if (!resource || resource.trim().length < 1) {
            throw new Error('El recurso es obligatorio');
        }
        this.resources.push(resource.trim());
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Agregar una etiqueta
     */
    addTag(tag) {
        if (!tag || tag.trim().length < 1) {
            throw new Error('La etiqueta es obligatoria');
        }
        this.tags.push(tag.trim().toLowerCase());
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Eliminar un beneficio
     */
    removeBenefit(index) {
        if (index < 0 || index >= this.benefits.length) {
            throw new Error('Índice de beneficio inválido');
        }
        this.benefits.splice(index, 1);
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Eliminar un paso
     */
    removeStep(index) {
        if (index < 0 || index >= this.steps.length) {
            throw new Error('Índice de paso inválido');
        }
        this.steps.splice(index, 1);
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Eliminar un recurso
     */
    removeResource(index) {
        if (index < 0 || index >= this.resources.length) {
            throw new Error('Índice de recurso inválido');
        }
        this.resources.splice(index, 1);
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Validar datos para creación
     */
    validateForCreation() {
        const errors = [];

        if (!this.title || this.title.trim().length < 3) {
            errors.push('El título debe tener al menos 3 caracteres');
        }
        if (!this.description || this.description.trim().length < 10) {
            errors.push('La descripción debe tener al menos 10 caracteres');
        }
        if (!this.category || !Object.values(ACTIVITY_CATEGORIES).includes(this.category)) {
            errors.push('Categoría inválida');
        }
        if (!this.difficulty || !Object.values(ACTIVITY_DIFFICULTY).includes(this.difficulty)) {
            errors.push('Dificultad inválida');
        }
        if (!this.duration || this.duration < 1) {
            errors.push('La duración debe ser mayor a 0 minutos');
        }
        if (!this.steps || this.steps.length === 0) {
            errors.push('Debes agregar al menos un paso');
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
            createdBy: this.createdBy,
            title: this.title,
            description: this.description,
            category: this.category,
            difficulty: this.difficulty,
            duration: this.duration,
            benefits: this.benefits,
            steps: this.steps,
            resources: this.resources,
            tags: this.tags,
            imageURL: this.imageURL,
            isActive: this.isActive,
            status: this.status,
            timesCompleted: this.timesCompleted,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}