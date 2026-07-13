/* ========================================
   AUTH SERVICE - Servicio unificado de autenticación
   Actúa como puente entre UserService y AdminService
   ======================================== */

import { UserService } from './userService.js';
import { AdminService } from './adminService.js';

export const AuthService = {
    /**
     * Obtiene la sesión actual (prioriza admin, luego user)
     */
    getSession() {
        // Primero verificar si hay sesión de admin
        const adminSession = AdminService.getSession();
        if (adminSession) {
            return adminSession;
        }
        
        // Si no, verificar sesión de usuario
        const userSession = UserService.getSession();
        if (userSession) {
            return userSession;
        }
        
        return null;
    },

    /**
     * Obtiene el usuario actual
     */
    getCurrentUser() {
        return this.getSession();
    },

    /**
     * Verifica si hay un usuario autenticado
     */
    isAuthenticated() {
        const session = this.getSession();
        return !!session;
    },

    /**
     * Obtiene el rol del usuario actual (sync)
     */
    getUserRoleSync() {
        const session = this.getSession();
        if (!session) return 'guest';
        return session.role || 'guest';
    },

    /**
     * Login como usuario regular
     */
    async loginUser(email, password, isGoogle = false) {
        try {
            const result = await UserService.login(email, password, isGoogle);
            
            // Guardar en window para acceso global
            window.AuthService = this;
            
            return {
                success: true,
                userData: result.userData,
                user: result.user,
                role: 'user',
                service: 'UserService'
            };
        } catch (error) {
            console.error('❌ Error en loginUser:', error);
            throw error;
        }
    },

    /**
     * Login como administrador
     */
    async loginAdmin(email, password, isGoogle = false) {
        try {
            const result = await AdminService.login(email, password, isGoogle);
            
            // Guardar en window para acceso global
            window.AuthService = this;
            
            return {
                success: true,
                userData: result.adminData,
                user: result.user,
                role: 'admin',
                service: 'AdminService'
            };
        } catch (error) {
            console.error('❌ Error en loginAdmin:', error);
            throw error;
        }
    },

    /**
     * Login automático - detecta si es admin o user
     */
    async login(email, password, isGoogle = false) {
        let lastError = null;
        
        // 1. Intentar como usuario regular primero
        try {
            const result = await this.loginUser(email, password, isGoogle);
            console.log('✅ Login exitoso como usuario');
            return result;
        } catch (error) {
            console.log('⚠️ No es usuario, intentando como admin...');
            lastError = error;
        }
        
        // 2. Intentar como administrador
        try {
            const result = await this.loginAdmin(email, password, isGoogle);
            console.log('✅ Login exitoso como administrador');
            return result;
        } catch (error) {
            console.log('❌ Tampoco es admin');
            lastError = error;
        }
        
        // 3. Si ambos fallan, lanzar el error del primer intento
        throw lastError || new Error('Credenciales inválidas');
    },

    /**
     * Logout - cierra ambas sesiones
     */
    async logout() {
        try {
            // Cerrar sesión de usuario
            await UserService.logout();
        } catch (e) {
            console.warn('Error cerrando sesión de usuario:', e);
        }
        
        try {
            // Cerrar sesión de admin
            await AdminService.logout();
        } catch (e) {
            console.warn('Error cerrando sesión de admin:', e);
        }
        
        // Limpiar window
        window.AuthService = null;
        
        // Disparar evento
        this._dispatchAuthChange(null);
        
        return true;
    },

    /**
     * Observa cambios en el estado de autenticación
     */
    onAuthStateChange(callback) {
        // Obtener estado actual
        const session = this.getSession();
        callback(session);

        // Escuchar eventos de auth
        const handler = (e) => callback(e.detail);
        window.addEventListener('auth:stateChanged', handler);

        // También escuchar cambios en localStorage
        const storageHandler = (e) => {
            if (e.key === 'user-TYRVANGUARD' || e.key === 'admin_session') {
                const newSession = this.getSession();
                callback(newSession);
            }
        };
        window.addEventListener('storage', storageHandler);

        return () => {
            window.removeEventListener('auth:stateChanged', handler);
            window.removeEventListener('storage', storageHandler);
        };
    },

    /**
     * Dispara evento de cambio de autenticación
     */
    _dispatchAuthChange(userData) {
        window.dispatchEvent(new CustomEvent('auth:stateChanged', { 
            detail: userData 
        }));
    }
};

// Exponer AuthService globalmente
window.AuthService = AuthService;

export default AuthService;