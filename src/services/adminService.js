/* ========================================
   ADMIN SERVICE - Business logic for admins only
   ======================================== */

import { Admin, ROLES } from '../classes/adminModel.js';
import { AdminRepository } from '../repositories/adminRepository.js';
import { CacheService, STORES } from './cacheService.js';

export { ROLES };

// ADMIN_CODE - Código secreto para crear admins (debe estar en variables de entorno)
const ADMIN_SECRET_CODE = 'VANGUARD-ADMIN-2024'; // ⚠️ CAMBIAR ESTO

export const AdminService = {
    /**
     * Validate admin code
     */
    validateAdminCode(code) {
        // Validación simple - mejorar con hash en producción
        return code === ADMIN_SECRET_CODE;
    },

    /**
     * Register new admin (creates in 'admins' collection)
     */
    async register(adminData, password) {
        // Validations
        if (!adminData.firstName || adminData.firstName.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        if (!adminData.lastName || adminData.lastName.trim().length < 2) {
            throw new Error('El apellido debe tener al menos 2 caracteres');
        }
        if (!adminData.email || !this._validateEmail(adminData.email)) {
            throw new Error('Correo electrónico inválido');
        }
        if (!password || password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        // Check if admin already exists in admins collection
        const existing = await AdminRepository.getByEmail(adminData.email.toLowerCase().trim());
        if (existing) {
            throw new Error('Ya existe un administrador registrado con este correo');
        }

        // Create admin instance
        const admin = new Admin({
            firstName: adminData.firstName.trim(),
            lastName: adminData.lastName.trim(),
            email: adminData.email.toLowerCase().trim(),
            photoURL: adminData.photoURL || '',
            role: adminData.role || ROLES.ADMIN,
            isActive: true,
            provider: 'email'
        });

        // Validate
        const validation = admin.validateForRegistration();
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Register in Firebase (creates auth user + admin document in 'admins')
        const result = await AdminRepository.registerWithEmail(
            admin.email, 
            password, 
            admin.toFirestore()
        );

        // Clear admin cache
        await CacheService.clearAdminCache();

        return result;
    },

    /**
     * Login admin (only checks 'admins' collection)
     */
    async login(email, password, isGoogle = false) {
        let result;

        if (isGoogle) {
            result = await AdminRepository.loginWithGoogle();
        } else {
            if (!email || !this._validateEmail(email)) {
                throw new Error('Correo electrónico inválido');
            }
            if (!password) {
                throw new Error('La contraseña es requerida');
            }
            result = await AdminRepository.loginWithEmail(
                email.toLowerCase().trim(), 
                password
            );
        }

        // ✅ Verificar que existe en la colección 'admins'
        if (!result.adminData) {
            throw new Error('No se encontró información del administrador');
        }

        if (!result.adminData.isActive) {
            throw new Error('Esta cuenta ha sido desactivada');
        }

        // Save session
        const adminInstance = new Admin(result.adminData);
        this._saveSession(adminInstance.summary);
        this._dispatchAuthChange(adminInstance.summary);

        return result;
    },

    /**
     * Logout admin
     */
    async logout() {
        await AdminRepository.logout();
        this._clearSession();
        this._dispatchAuthChange(null);
        return true;
    },

    /**
     * Get current admin session
     */
    getSession() {
        return this._getSession();
    },

    /**
     * Check if admin is authenticated
     */
    isAuthenticated() {
        const session = this._getSession();
        return !!session && !!AdminRepository.getCurrentAuthUser();
    },

    /**
     * Get current admin role (sync)
     */
    getAdminRoleSync() {
        const session = this._getSession();
        if (!session) return ROLES.GUEST;
        return session.role || ROLES.ADMIN;
    },

    /**
     * Get current admin data from Firestore
     */
    async getCurrentAdminData() {
        const session = this._getSession();
        if (!session || !session.id) return null;
        
        const adminData = await AdminRepository.getById(session.id);
        return adminData ? new Admin(adminData) : null;
    },

    /**
     * Update admin profile
     */
    async updateProfile(adminId, updateData) {
        const allowedFields = ['firstName', 'lastName', 'photoURL', 'role', 'isActive'];
        const filteredData = {};
        
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) {
                filteredData[key] = updateData[key];
            }
        }

        if (Object.keys(filteredData).length === 0) {
            throw new Error('No hay datos válidos para actualizar');
        }

        const result = await AdminRepository.update(adminId, filteredData);
        
        // Update session if it's the current admin
        const session = this._getSession();
        if (session && session.id === adminId) {
            const updatedAdmin = new Admin(result);
            this._saveSession(updatedAdmin.summary);
            this._dispatchAuthChange(updatedAdmin.summary);
        }

        // Clear admin cache
        await CacheService.clearAdminCache();

        return result;
    },

    /**
     * Get admin by ID (with cache)
     */
    async getAdminById(adminId) {
        // Try cache first
        const cached = await CacheService.getCache(STORES.ADMINS, adminId);
        if (cached) {
            return new Admin(cached);
        }

        const adminData = await AdminRepository.getById(adminId);
        if (!adminData) return null;

        const admin = new Admin(adminData);
        
        // Cache for 1 hour
        await CacheService.setCache(STORES.ADMINS, adminId, admin.toFirestore(), 3600000);
        
        return admin;
    },

    /**
     * Get all admins (with filters)
     */
    async getAdmins(filters = {}) {
        const adminsData = await AdminRepository.getAll(filters);
        return adminsData.map(data => new Admin(data));
    },

    /**
     * Reset password
     */
    async resetPassword(email) {
        if (!email || !this._validateEmail(email)) {
            throw new Error('Correo electrónico inválido');
        }
        
        const admin = await AdminRepository.getByEmail(email.toLowerCase().trim());
        if (!admin) {
            throw new Error('No existe un administrador con este correo');
        }

        await AdminRepository.resetPassword(email);
        return true;
    },

    /**
     * Delete admin
     */
    async deleteAdmin(adminId) {
        const session = this._getSession();
        if (session && session.id === adminId) {
            throw new Error('No puedes eliminar tu propia cuenta mientras estás autenticado');
        }

        const result = await AdminRepository.delete(adminId);
        
        // Clear admin cache
        await CacheService.clearAdminCache();
        
        return result;
    },

    /**
     * Promote admin to super admin
     */
    async promoteToSuperAdmin(adminId) {
        const admin = await this.getAdminById(adminId);
        if (!admin) {
            throw new Error('Administrador no encontrado');
        }
        
        admin.updateRole(ROLES.SUPER_ADMIN);
        const result = await AdminRepository.update(adminId, admin.toFirestore());
        
        // Clear admin cache
        await CacheService.clearAdminCache();
        
        return result;
    },

    /**
     * Demote super admin to admin
     */
    async demoteToAdmin(adminId) {
        const admin = await this.getAdminById(adminId);
        if (!admin) {
            throw new Error('Administrador no encontrado');
        }
        
        admin.updateRole(ROLES.ADMIN);
        const result = await AdminRepository.update(adminId, admin.toFirestore());
        
        // Clear admin cache
        await CacheService.clearAdminCache();
        
        return result;
    },

    /**
     * Observe auth state changes
     */
    onAuthStateChange(callback) {
        const adminData = this._getSession();
        callback(adminData);

        const handler = (e) => callback(e.detail);
        window.addEventListener('auth:stateChanged', handler);

        return () => window.removeEventListener('auth:stateChanged', handler);
    },

    // ========== PRIVATE METHODS ==========

    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    _saveSession(adminData) {
        localStorage.setItem('admin_session', JSON.stringify(adminData));
    },

    _getSession() {
        const session = localStorage.getItem('admin_session');
        return session ? JSON.parse(session) : null;
    },

    _clearSession() {
        localStorage.removeItem('admin_session');
    },

    _dispatchAuthChange(adminData) {
        window.dispatchEvent(new CustomEvent('auth:stateChanged', { detail: adminData }));
    }
};