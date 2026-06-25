/* ========================================
   USER SERVICE - Business logic
   ======================================== */

import { User, ROLES, PLANS } from '../classes/userModel.js';
import { UserRepository } from '../repositories/userRepository.js';
import { CacheService, STORES } from '../services/cacheService.js';

export { ROLES, PLANS };

export const UserService = {
    /**
     * Register new user
     */
    async register(userData, password) {
        // Validations
        if (!userData.firstName || userData.firstName.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        if (!userData.lastName || userData.lastName.trim().length < 2) {
            throw new Error('El apellido debe tener al menos 2 caracteres');
        }
        if (!userData.email || !this._validateEmail(userData.email)) {
            throw new Error('Correo electrónico inválido');
        }
        if (!password || password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        // Check if user already exists
        const existing = await UserRepository.getByEmail(userData.email.toLowerCase().trim());
        if (existing) {
            throw new Error('Ya existe un usuario registrado con este correo');
        }

        // Create user instance
        const user = new User({
            firstName: userData.firstName.trim(),
            lastName: userData.lastName.trim(),
            email: userData.email.toLowerCase().trim(),
            photoURL: userData.photoURL || '',
            role: userData.role || ROLES.USER,
            plan: userData.plan || PLANS.FREE,
            isActive: true,
            provider: 'email'
        });

        // Validate
        const validation = user.validateForRegistration();
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Register in Firebase
        const result = await UserRepository.registerWithEmail(
            user.email, 
            password, 
            user.toFirestore()
        );

        // Clear cache
        await CacheService.clearCache(STORES.USERS);

        return result;
    },

    /**
     * Login user
     */
    async login(email, password, isGoogle = false) {
        let result;

        if (isGoogle) {
            result = await UserRepository.loginWithGoogle();
        } else {
            if (!email || !this._validateEmail(email)) {
                throw new Error('Correo electrónico inválido');
            }
            if (!password) {
                throw new Error('La contraseña es requerida');
            }
            result = await UserRepository.loginWithEmail(
                email.toLowerCase().trim(), 
                password
            );
        }

        if (!result.userData) {
            throw new Error('No se encontró información del usuario');
        }

        if (!result.userData.isActive) {
            throw new Error('Esta cuenta ha sido desactivada');
        }

        // Save session
        const userInstance = new User(result.userData);
        this._saveSession(userInstance.summary);
        this._dispatchAuthChange(userInstance.summary);

        return result;
    },

    /**
     * Logout user
     */
    async logout() {
        await UserRepository.logout();
        this._clearSession();
        this._dispatchAuthChange(null);
        return true;
    },

    /**
     * Get current user session
     */
    getSession() {
        return this._getSession();
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const session = this._getSession();
        return !!session && !!UserRepository.getCurrentAuthUser();
    },

    /**
     * Get current user role (sync)
     */
    getUserRoleSync() {
        const session = this._getSession();
        if (!session) return ROLES.GUEST;
        return session.role || ROLES.USER;
    },

    /**
     * Get current user data from Firestore
     */
    async getCurrentUserData() {
        const session = this._getSession();
        if (!session || !session.id) return null;
        
        const userData = await UserRepository.getById(session.id);
        return userData ? new User(userData) : null;
    },

    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        const allowedFields = ['firstName', 'lastName', 'photoURL', 'plan', 'role', 'isActive'];
        const filteredData = {};
        
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) {
                filteredData[key] = updateData[key];
            }
        }

        if (Object.keys(filteredData).length === 0) {
            throw new Error('No hay datos válidos para actualizar');
        }

        const result = await UserRepository.update(userId, filteredData);
        
        // Update session if it's the current user
        const session = this._getSession();
        if (session && session.id === userId) {
            const updatedUser = new User(result);
            this._saveSession(updatedUser.summary);
            this._dispatchAuthChange(updatedUser.summary);
        }

        // Clear cache
        await CacheService.clearCache(STORES.USERS);

        return result;
    },

    /**
     * Get user by ID (with cache)
     */
    async getUserById(userId) {
        // Try cache first
        const cached = await CacheService.getCache(STORES.USERS, userId);
        if (cached) {
            return new User(cached);
        }

        const userData = await UserRepository.getById(userId);
        if (!userData) return null;

        const user = new User(userData);
        
        // Cache for 1 hour
        await CacheService.setCache(STORES.USERS, userId, user.toFirestore(), 3600000);
        
        return user;
    },

    /**
     * Get all users (with filters)
     */
    async getUsers(filters = {}) {
        const usersData = await UserRepository.getAll(filters);
        return usersData.map(data => new User(data));
    },

    /**
     * Reset password
     */
    async resetPassword(email) {
        if (!email || !this._validateEmail(email)) {
            throw new Error('Correo electrónico inválido');
        }
        
        const user = await UserRepository.getByEmail(email.toLowerCase().trim());
        if (!user) {
            throw new Error('No existe un usuario con este correo');
        }

        await UserRepository.resetPassword(email);
        return true;
    },

    /**
     * Delete user
     */
    async deleteUser(userId) {
        const session = this._getSession();
        if (session && session.id === userId) {
            throw new Error('No puedes eliminar tu propia cuenta mientras estás autenticado');
        }

        const result = await UserRepository.delete(userId);
        
        // Clear cache
        await CacheService.clearCache(STORES.USERS);
        
        return result;
    },

    /**
     * Observe auth state changes
     */
    onAuthStateChange(callback) {
        const userData = this._getSession();
        callback(userData);

        const handler = (e) => callback(e.detail);
        window.addEventListener('auth:stateChanged', handler);

        return () => window.removeEventListener('auth:stateChanged', handler);
    },

    // ========== PRIVATE METHODS ==========

    _validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    _saveSession(userData) {
        localStorage.setItem('user-TYRVANGUARD', JSON.stringify(userData));
    },

    _getSession() {
        const session = localStorage.getItem('user-TYRVANGUARD');
        return session ? JSON.parse(session) : null;
    },

    _clearSession() {
        localStorage.removeItem('user-TYRVANGUARD');
    },

    _dispatchAuthChange(userData) {
        window.dispatchEvent(new CustomEvent('auth:stateChanged', { detail: userData }));
    }
};