/* ========================================
   USER REPOSITORY - Firebase CRUD operations
   ======================================== */

import { db, auth } from '../../config/firebaseConfig.js';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signInWithPopup, GoogleAuthProvider, sendEmailVerification,
    updateProfile, signOut, sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

const USERS_COLLECTION = 'users';

export const UserRepository = {
    /**
     * Save user to Firestore
     */
    async save(userData) {
        const userRef = doc(db, USERS_COLLECTION, userData.id);
        await setDoc(userRef, userData);
        return { id: userData.id, ...userData };
    },

    /**
     * Get user by ID
     */
    async getById(userId) {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const docSnap = await getDoc(userRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    /**
     * Get user by email
     */
    async getByEmail(email) {
        const q = query(collection(db, USERS_COLLECTION), where('email', '==', email), limit(1));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    },

    /**
     * Get all users (with optional filters)
     */
    async getAll(filters = {}) {
        let constraints = [];
        
        if (filters.role) {
            constraints.push(where('role', '==', filters.role));
        }
        if (filters.isActive !== undefined) {
            constraints.push(where('isActive', '==', filters.isActive));
        }
        if (filters.plan) {
            constraints.push(where('plan', '==', filters.plan));
        }
        if (filters.orderBy) {
            constraints.push(orderBy(filters.orderBy.field, filters.orderBy.direction || 'asc'));
        }
        if (filters.limit) {
            constraints.push(limit(filters.limit));
        }

        const q = query(collection(db, USERS_COLLECTION), ...constraints);
        const querySnapshot = await getDocs(q);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    },

    /**
     * Update user
     */
    async update(userId, updateData) {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, { 
            ...updateData, 
            updatedAt: new Date().toISOString() 
        });
        return await this.getById(userId);
    },

    /**
     * Delete user
     */
    async delete(userId) {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await deleteDoc(userRef);
        return true;
    },

    /**
     * Register user with email/password
     */
    async registerWithEmail(email, password, userData) {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update profile
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        await updateProfile(firebaseUser, { 
            displayName: fullName || email,
            photoURL: userData.photoURL || null
        });

        // Send verification email
        await sendEmailVerification(firebaseUser);

        // Save to Firestore
        const userToSave = {
            id: firebaseUser.uid,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: firebaseUser.email,
            photoURL: userData.photoURL || '',
            role: userData.role || 'user',
            plan: userData.plan || 'free',
            isActive: true,
            emailVerified: false,
            provider: 'email',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            updatedAt: null
        };

        await this.save(userToSave);

        return { 
            user: firebaseUser, 
            userData: userToSave 
        };
    },

    /**
     * Login with email/password
     */
    async loginWithEmail(email, password) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        let userData = await this.getById(firebaseUser.uid);
        
        if (userData) {
            // Update last login
            await this.update(firebaseUser.uid, { 
                lastLogin: new Date().toISOString() 
            });
            userData = await this.getById(firebaseUser.uid);
        }

        return { 
            user: firebaseUser, 
            userData: userData || null 
        };
    },

    /**
     * Login with Google
     */
    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const firebaseUser = userCredential.user;

        let userData = await this.getById(firebaseUser.uid);

        if (!userData) {
            // Create new user if doesn't exist
            const nameParts = firebaseUser.displayName?.split(' ') || [];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            userData = {
                id: firebaseUser.uid,
                firstName: firstName,
                lastName: lastName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL || '',
                role: 'user',
                plan: 'free',
                isActive: true,
                emailVerified: firebaseUser.emailVerified,
                provider: 'google',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                updatedAt: null
            };
            await this.save(userData);
        } else {
            // Update existing user
            await this.update(firebaseUser.uid, { 
                lastLogin: new Date().toISOString() 
            });
            userData = await this.getById(firebaseUser.uid);
        }

        return { 
            user: firebaseUser, 
            userData: userData 
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
            'auth/email-already-in-use': 'Este correo ya está registrado',
            'auth/invalid-email': 'Correo electrónico inválido',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/popup-closed-by-user': 'Ventana de Google cerrada',
            'auth/too-many-requests': 'Demasiados intentos, intente más tarde',
            'auth/network-request-failed': 'Error de conexión, verifique su internet'
        };
        return new Error(errors[error.code] || `Error de autenticación: ${error.message}`);
    }
};