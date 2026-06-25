/* ========================================
   ADMIN MODEL - Admin data structure
   ======================================== */

export const ROLES = {
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
    GUEST: 'guest'
};

export class Admin {
    constructor(data = {}) {
        // Identification
        this.id = data.id || null;
        
        // Personal data
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.email = data.email || '';
        this.photoURL = data.photoURL || '';
        
        // Role (always admin or super_admin)
        this.role = data.role || ROLES.ADMIN;
        
        // Account status
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.emailVerified = data.emailVerified || false;
        
        // Auth provider
        this.provider = data.provider || 'email'; // 'email' | 'google'
        
        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.lastLogin = data.lastLogin || null;
        this.updatedAt = data.updatedAt || null;
    }

    // ========== GETTERS ==========

    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim() || 'Administrador';
    }

    get initials() {
        const first = this.firstName ? this.firstName.charAt(0) : '';
        const last = this.lastName ? this.lastName.charAt(0) : '';
        return (first + last).toUpperCase() || 'A';
    }

    get isSuperAdmin() {
        return this.role === ROLES.SUPER_ADMIN;
    }

    get isAdmin() {
        return this.role === ROLES.ADMIN || this.role === ROLES.SUPER_ADMIN;
    }

    // Summary data for localStorage/session
    get summary() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            fullName: this.fullName,
            initials: this.initials,
            photoURL: this.photoURL,
            role: this.role,
            isActive: this.isActive,
            provider: this.provider,
            isAdmin: true // Mark as admin for localStorage
        };
    }

    // ========== METHODS ==========

    // Update role (only between admin and super_admin)
    updateRole(newRole) {
        if (!Object.values(ROLES).includes(newRole) || newRole === ROLES.GUEST) {
            throw new Error(`Rol inválido: ${newRole}`);
        }
        this.role = newRole;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Toggle account status
    toggleStatus(active) {
        this.isActive = active;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Update photo
    updatePhoto(url) {
        this.photoURL = url;
        this.updatedAt = new Date().toISOString();
        return this;
    }

    // Register login
    registerLogin() {
        this.lastLogin = new Date().toISOString();
        return this;
    }

    // Validate data for registration
    validateForRegistration() {
        const errors = [];

        if (!this.firstName || this.firstName.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }
        if (!this.lastName || this.lastName.trim().length < 2) {
            errors.push('El apellido debe tener al menos 2 caracteres');
        }
        if (!this.email || !this._validateEmail(this.email)) {
            errors.push('Correo electrónico inválido');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Private: validate email
    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Convert to plain object for Firestore
    toFirestore() {
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            photoURL: this.photoURL,
            role: this.role,
            isActive: this.isActive,
            emailVerified: this.emailVerified,
            provider: this.provider,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin,
            updatedAt: this.updatedAt
        };
    }
}