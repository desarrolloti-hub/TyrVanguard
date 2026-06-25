/* ========================================
   ADMIN REPOSITORY - Firebase CRUD operations
   Uses 'admins' collection
   ======================================== */

import { db, auth } from '/config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signInWithPopup, GoogleAuthProvider, sendEmailVerification,
    updateProfile, signOut, sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

const ADMINS_COLLECTION = 'admins'; // ✅ Colección separada

export const AdminRepository = {
    /**
     * Save admin to Firestore (in 'admins' collection)
     */
    async save(adminData) {
        const adminRef = doc(db, ADMINS_COLLECTION, adminData.id);
        await setDoc(adminRef, adminData);
        return { id: adminData.id, ...adminData };
    },

    /**
     * Get admin by ID
     */
    async getById(adminId) {
        const adminRef = doc(db, ADMINS_COLLECTION, adminId);
        const docSnap = await getDoc(adminRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    /**
     * Get admin by email
     */
    async getByEmail(email) {
        const q = query(collection(db, ADMINS_COLLECTION), where('email', '==', email), limit(1));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    /**
     * Get all admins (with optional filters)
     */
    async getAll(filters = {}) {
        let constraints = [];
        
        if (filters.role) {
            constraints.push(where('role', '==', filters.role));
        }
        if (filters.isActive !== undefined) {
            constraints.push(where('isActive', '==', filters.isActive));
        }
        if (filters.orderBy) {
            constraints.push(orderBy(filters.orderBy.field, filters.orderBy.direction || 'asc'));
        }
        if (filters.limit) {
            constraints.push(limit(filters.limit));
        }

        const q = query(collection(db, ADMINS_COLLECTION), ...constraints);
        const querySnapshot = await getDocs(q);
        
        const admins = [];
        querySnapshot.forEach((doc) => {
            admins.push({ id: doc.id, ...doc.data() });
        });
        return admins;
    },

    /**
     * Update admin
     */
    async update(adminId, updateData) {
        const adminRef = doc(db, ADMINS_COLLECTION, adminId);
        await updateDoc(adminRef, { 
            ...updateData, 
            updatedAt: new Date().toISOString() 
        });
        return await this.getById(adminId);
    },

    /**
     * Delete admin
     */
    async delete(adminId) {
        const adminRef = doc(db, ADMINS_COLLECTION, adminId);
        await deleteDoc(adminRef);
        return true;
    },

    /**
     * Register admin with email/password
     * Crea usuario en Auth + documento en 'admins'
     */
    async registerWithEmail(email, password, adminData) {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update profile
        const fullName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim();
        await updateProfile(firebaseUser, { 
            displayName: fullName || email,
            photoURL: adminData.photoURL || null
        });

        // Send verification email
        await sendEmailVerification(firebaseUser);

        // Save to 'admins' collection
        const adminToSave = {
            id: firebaseUser.uid,
            firstName: adminData.firstName || '',
            lastName: adminData.lastName || '',
            email: firebaseUser.email,
            photoURL: adminData.photoURL || '',
            role: adminData.role || 'admin',
            isActive: true,
            emailVerified: false,
            provider: 'email',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            updatedAt: null
        };

        await this.save(adminToSave);

        return { 
            user: firebaseUser, 
            adminData: adminToSave 
        };
    },

    /**
     * Login with email/password
     * Solo verifica en 'admins' collection
     */
    async loginWithEmail(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // ✅ Buscar en 'admins' collection
        let adminData = await this.getById(firebaseUser.uid);
        
        if (adminData) {
            // Update last login
            await this.update(firebaseUser.uid, { 
                lastLogin: new Date().toISOString() 
            });
            adminData = await this.getById(firebaseUser.uid);
        }

        return { 
            user: firebaseUser, 
            adminData: adminData || null 
        };
    },

    /**
     * Login with Google
     * Solo verifica/crea en 'admins' collection
     */
    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const firebaseUser = userCredential.user;

        // ✅ Buscar en 'admins' collection
        let adminData = await this.getById(firebaseUser.uid);

        if (!adminData) {
            // Create new admin if doesn't exist (always with admin role)
            const nameParts = firebaseUser.displayName?.split(' ') || [];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            adminData = {
                id: firebaseUser.uid,
                firstName: firstName,
                lastName: lastName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL || '',
                role: 'admin',
                isActive: true,
                emailVerified: firebaseUser.emailVerified,
                provider: 'google',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                updatedAt: null
            };
            await this.save(adminData);
        } else {
            // Update existing admin
            await this.update(firebaseUser.uid, { 
                lastLogin: new Date().toISOString() 
            });
            adminData = await this.getById(firebaseUser.uid);
        }

        return { 
            user: firebaseUser, 
            adminData: adminData 
        };
    },

    /**
     * Reset password
     */
    async resetPassword(email) {
        await sendPasswordResetEmail(auth, email);
        return true;
    },

    /**
     * Logout
     */
    async logout() {
        await signOut(auth);
        return true;
    },

    /**
     * Get current auth user
     */
    getCurrentAuthUser() {
        return auth.currentUser;
    },

    /**
     * Handle auth errors
     */
    _handleAuthError(error) {
        const errors = {
            'auth/email-already-in-use': 'Este correo ya está registrado como administrador',
            'auth/invalid-email': 'Correo electrónico inválido',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
            'auth/user-not-found': 'Administrador no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/popup-closed-by-user': 'Ventana de Google cerrada',
            'auth/too-many-requests': 'Demasiados intentos, intente más tarde',
            'auth/network-request-failed': 'Error de conexión, verifique su internet'
        };
        return new Error(errors[error.code] || `Error de autenticación: ${error.message}`);
    }
};