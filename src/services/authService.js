/* ========================================
   AUTH SERVICE - Authentication management only
   DOES NOT know about layouts, DOES NOT redirect
   ======================================== */

import { UserService, ROLES } from './userService.js';

export { ROLES };

export const AuthService = {
    /**
     * Observe authentication state changes
     */
    onAuthStateChange(callback) {
        const userData = UserService.getSession();
        callback(userData);
        
        const handler = (e) => callback(e.detail);
        window.addEventListener('auth:stateChanged', handler);
        
        return () => window.removeEventListener('auth:stateChanged', handler);
    },
    
    /**
     * Get user role (sync)
     */
    getUserRoleSync() {
        const session = UserService.getSession();
        if (!session) return ROLES.GUEST;
        return session.role || ROLES.USER;
    },
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return UserService.isAuthenticated();
    },
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return UserService.getSession();
    },
    
    /**
     * Get current user full data from Firestore
     */
    async getCurrentUserData() {
        return await UserService.getCurrentUserData();
    },
    
    /**
     * Logout
     */
    async logout() {
        return await UserService.logout();
    },
    
    /**
     * Login with email/password or Google
     */
    async login(email, password, isGoogle = false) {
        return await UserService.login(email, password, isGoogle);
    },
    
    /**
     * Register new user
     */
    async register(userData, password) {
        return await UserService.register(userData, password);
    },
    
    /**
     * Reset password
     */
    async resetPassword(email) {
        return await UserService.resetPassword(email);
    },
    
    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        return await UserService.updateProfile(userId, updateData);
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
    }
};