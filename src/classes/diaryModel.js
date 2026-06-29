/* ========================================
   DIARY MODEL - Estructura de datos del diario
   ======================================== */

export const DIARY_TAGS = {
    VICTORIA: 'victory',
    APRENDIZAJE: 'learning',
    BATALLA: 'battle',
    REFLEXION: 'reflection',
    LOGRO: 'achievement'
};

export class Diary {
    constructor(data = {}) {
        // Identificación
        this.id = data.id || null;
        this.userId = data.userId || null;
        
        // Datos principales
        this.title = data.title || '';
        this.content = data.content || '';
        this.tag = data.tag || DIARY_TAGS.REFLEXION;
        
        // Fechas
        this.date = data.date || new Date().toISOString();
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
        
        // Metadatos
        this.battleId = data.battleId || null; // Si pertenece a una batalla
        this.goalId = data.goalId || null; // Si pertenece a una meta
    }

    // ========== GETTERS ==========

    get tagLabel() {
        const labels = {
            [DIARY_TAGS.VICTORIA]: '🏆 Victoria',
            [DIARY_TAGS.APRENDIZAJE]: '📖 Aprendizaje',
            [DIARY_TAGS.BATALLA]: '⚔️ Batalla',
            [DIARY_TAGS.REFLEXION]: '🧠 Reflexión',
            [DIARY_TAGS.LOGRO]: '⭐ Logro'
        };
        return labels[this.tag] || this.tag;
    }

    get tagIcon() {
        const icons = {
            [DIARY_TAGS.VICTORIA]: 'fa-trophy',
            [DIARY_TAGS.APRENDIZAJE]: 'fa-book',
            [DIARY_TAGS.BATALLA]: 'fa-sword',
            [DIARY_TAGS.REFLEXION]: 'fa-brain',
            [DIARY_TAGS.LOGRO]: 'fa-star'
        };
        return icons[this.tag] || 'fa-feather-alt';
    }

    get tagClass() {
        const classes = {
            [DIARY_TAGS.VICTORIA]: 'tag-victoria',
            [DIARY_TAGS.APRENDIZAJE]: 'tag-aprendizaje',
            [DIARY_TAGS.BATALLA]: 'tag-batalla',
            [DIARY_TAGS.REFLEXION]: 'tag-reflexion',
            [DIARY_TAGS.LOGRO]: 'tag-logro'
        };
        return classes[this.tag] || 'tag-reflexion';
    }

    get formattedDate() {
        if (!this.date) return '';
        const date = new Date(this.date);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    get formattedDateTime() {
        if (!this.date) return '';
        const date = new Date(this.date);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    get summary() {
        return {
            id: this.id,
            userId: this.userId,
            title: this.title,
            content: this.content,
            tag: this.tag,
            tagLabel: this.tagLabel,
            tagIcon: this.tagIcon,
            tagClass: this.tagClass,
            date: this.date,
            formattedDate: this.formattedDate,
            formattedDateTime: this.formattedDateTime,
            battleId: this.battleId,
            goalId: this.goalId
        };
    }

    get preview() {
        const maxLength = 120;
        const text = this.content || '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // ========== MÉTODOS ==========

    /**
     * Validar datos para creación
     */
    validateForCreation() {
        const errors = [];

        if (!this.title || this.title.trim().length < 2) {
            errors.push('El título debe tener al menos 2 caracteres');
        }
        if (!this.content || this.content.trim().length < 5) {
            errors.push('El contenido debe tener al menos 5 caracteres');
        }
        if (!this.tag || !Object.values(DIARY_TAGS).includes(this.tag)) {
            errors.push('Etiqueta inválida');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Actualizar entrada
     */
    update(data) {
        if (data.title) this.title = data.title.trim();
        if (data.content) this.content = data.content.trim();
        if (data.tag) this.tag = data.tag;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Asignar a una batalla
     */
    linkToBattle(battleId) {
        this.battleId = battleId;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    /**
     * Asignar a una meta
     */
    linkToGoal(goalId) {
        this.goalId = goalId;
        this.updatedAt = new Date().toISOString();
        return this;
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
            content: this.content,
            tag: this.tag,
            date: this.date,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            battleId: this.battleId,
            goalId: this.goalId
        };
    }
}