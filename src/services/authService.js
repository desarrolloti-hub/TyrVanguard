/* ========================================
   AUTH SERVICE - Authentication management
   Supports both Users and Admins
   ======================================== */

import { UserService, ROLES as UserRoles } from './userService.js';
import { AdminService, ROLES as AdminRoles } from './adminService.js';

export const ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
    GUEST: 'guest'
};

export const AuthService = {
    /**
     * Observe authentication state changes
     * Detecta si es admin o user y devuelve los datos correspondientes
     */
    onAuthStateChange(callback) {
        // Verificar si hay sesión de admin
        const adminData = AdminService.getSession();
        if (adminData) {
            callback(adminData);
        } else {
            // Si no hay admin, verificar sesión de user
            const userData = UserService.getSession();
            callback(userData);
        }
        
        const handler = (e) => callback(e.detail);
        window.addEventListener('auth:stateChanged', handler);
        
        return () => window.removeEventListener('auth:stateChanged', handler);
    },
    
    /**
     * Get current user role (sync)
     */
    getCurrentRole() {
        // Primero verificar si es admin
        const adminSession = AdminService.getSession();
        if (adminSession) {
            return adminSession.role || ROLES.ADMIN;
        }
        
        // Si no, verificar si es user
        const userSession = UserService.getSession();
        if (userSession) {
            return userSession.role || ROLES.USER;
        }
        
        return ROLES.GUEST;
    },
    
    /**
     * Check if user is authenticated (admin or user)
     */
    isAuthenticated() {
        return AdminService.isAuthenticated() || UserService.isAuthenticated();
    },
    
    /**
     * Get current user (admin or user)
     */
    getCurrentUser() {
        const admin = AdminService.getSession();
        if (admin) return admin;
        
        return UserService.getSession();
    },
    
    /**
     * Check if current user is admin
     */
    isAdmin() {
        const session = this.getCurrentUser();
        if (!session) return false;
        return session.role === ROLES.ADMIN || session.role === ROLES.SUPER_ADMIN;
    },
    
    /**
     * Check if current user is super admin
     */
    isSuperAdmin() {
        const session = this.getCurrentUser();
        if (!session) return false;
        return session.role === ROLES.SUPER_ADMIN;
    },
    
    /**
     * Check if current user has specific role
     */
    hasRole(requiredRole) {
        const session = this.getCurrentUser();
        if (!session) return false;
        return session.role === requiredRole;
    },
    
    /**
     * Logout (cierra sesión de admin o user)
     */
    async logout() {
        if (AdminService.isAuthenticated()) {
            await AdminService.logout();
        } else if (UserService.isAuthenticated()) {
            await UserService.logout();
        }
        return true;
    },
    
    // ========== ADMIN METHODS ==========
    
    /**
     * Login as admin
     */
    async loginAdmin(email, password, isGoogle = false) {
        return await AdminService.login(email, password, isGoogle);
    },
    
    /**
     * Register new admin
     */
    async registerAdmin(adminData, password) {
        return await AdminService.register(adminData, password);
    },
    
    /**
     * Get admin session
     */
    getAdminSession() {
        return AdminService.getSession();
    },
    
    /**
     * Check if admin is authenticated
     */
    isAdminAuthenticated() {
        return AdminService.isAuthenticated();
    },
    
    /**
     * Get admin role
     */
    getAdminRole() {
        return AdminService.getAdminRoleSync();
    },
    
    /**
     * Get all admins
     */
    async getAdmins(filters = {}) {
        return await AdminService.getAdmins(filters);
    },
    
    /**
     * Promote admin to super admin
     */
    async promoteToSuperAdmin(adminId) {
        return await AdminService.promoteToSuperAdmin(adminId);
    },
    
    // ========== USER METHODS ==========
    
    /**
     * Login as regular user
     */
    async loginUser(email, password, isGoogle = false) {
        return await UserService.login(email, password, isGoogle);
    },
    
    /**
     * Register new user
     */
    async registerUser(userData, password) {
        return await UserService.register(userData, password);
    },
    
    /**
     * Get user session
     */
    getUserSession() {
        return UserService.getSession();
    },
    
    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        return UserService.isAuthenticated();
    },
    
    /**
     * Get user role
     */
    getUserRole() {
        return UserService.getUserRoleSync();
    },
    
    /**
     * Get all users
     */
    async getUsers(filters = {}) {
        return await UserService.getUsers(filters);
    }
};