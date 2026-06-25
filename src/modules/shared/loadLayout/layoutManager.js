/* ========================================
   LAYOUT MANAGER - Versión corregida
   ======================================== */

import { AuthService } from '../../../services/authService.js';

// Mapeo de roles a layouts
const LAYOUTS = {
    GUEST: {
        navbar: '/modules/visitor/layout/navbar.html',
        footer: '/modules/visitor/layout/footer.html',
        home: '/modules/visitor/home/home.html',
        navbarController: 'visitor',
        footerController: 'visitor'
    },
    USER: {
        navbar: '/modules/user/layout/navbarUser.html',
        footer: '/modules/user/layout/footerUser.html',
        home: '/modules/user/home/homeUser.html',
        navbarController: 'user',
        footerController: 'user'
    },
    ADMIN: {
        navbar: '/modules/admin/layout/navbarAdmin.html',
        footer: '/modules/admin/layout/footerAdmin.html',
        home: '/modules/admin/home/homeAdmin.html',
        navbarController: 'admin',
        footerController: 'admin'
    }
};

// Controladores asociados a cada layout
const CONTROLLERS = {
    visitor: {
        navbar: () => import('../../../modules/visitor/layout/navbarController.js').then(m => m.initNavbarController),
        footer: () => import('../../../modules/visitor/layout/footerController.js').then(m => m.initFooterController)
    },
    user: {
        navbar: () => import('../../../modules/user/layout/navbarUserController.js').then(m => m.initNavbarUserController),
        footer: () => import('../../../modules/user/layout/footerUserController.js').then(m => m.initFooterUserController)
    },
    admin: {
        navbar: () => import('../../../modules/admin/layout/navbarAdminController.js').then(m => m.initNavbarAdminController),
        footer: () => import('../../../modules/admin/layout/footerAdminController.js').then(m => m.initFooterAdminController)
    }
};

// Estado del layout actual
let currentLayout = {
    role: 'GUEST',
    layout: LAYOUTS.GUEST,
    controllers: CONTROLLERS.visitor
};

// Bandera para evitar cargas múltiples
let isUpdating = false;

/**
 * Obtiene el rol del usuario desde localStorage directamente
 * (más confiable que depender del AuthService)
 */
function getUserRole() {
    try {
        // 1. Intentar desde localStorage directamente (más confiable)
        const sessionData = localStorage.getItem('user-TYRVANGUARD');
        if (sessionData) {
            try {
                const user = JSON.parse(sessionData);
                if (user?.role) {
                    console.log(`👤 Rol desde localStorage: ${user.role}`);
                    return user.role;
                }
            } catch (e) {
                console.warn('Error parsing session data:', e);
            }
        }
        
        // 2. Intentar desde AuthService
        if (window.AuthService) {
            const session = window.AuthService.getCurrentUser?.() || 
                           window.AuthService.getUserRoleSync?.();
            if (session?.role) {
                console.log(`👤 Rol desde AuthService: ${session.role}`);
                return session.role;
            }
        }
        
        console.log('👤 No hay sesión activa, rol: guest');
        return 'guest';
    } catch (error) {
        console.warn('Error obteniendo rol:', error);
        return 'guest';
    }
}

/**
 * Determina qué layout usar según el rol
 */
function getLayoutForRole(role) {
    const roleMap = {
        'guest': 'GUEST',
        'user': 'USER',
        'admin': 'ADMIN',
        'super_admin': 'ADMIN'
    };
    
    const layoutKey = roleMap[role] || 'GUEST';
    return LAYOUTS[layoutKey];
}

/**
 * Obtiene los controladores para un layout específico
 */
function getControllersForLayout(layoutKey) {
    const controllerMap = {
        'visitor': CONTROLLERS.visitor,
        'user': CONTROLLERS.user,
        'admin': CONTROLLERS.admin
    };
    
    return controllerMap[layoutKey] || CONTROLLERS.visitor;
}

/**
 * Carga un layout específico (navbar y footer)
 */
async function loadLayoutFiles(layout) {
    const [navbarHTML, footerHTML] = await Promise.all([
        fetch(layout.navbar).then(r => {
            if (!r.ok) throw new Error(`Error cargando navbar: ${r.status}`);
            return r.text();
        }),
        fetch(layout.footer).then(r => {
            if (!r.ok) throw new Error(`Error cargando footer: ${r.status}`);
            return r.text();
        })
    ]);
    
    return { navbarHTML, footerHTML };
}

/**
 * Inicializa los controladores del layout
 */
async function initLayoutControllers(controllers) {
    const results = [];
    
    if (controllers.navbar) {
        try {
            const initFn = await controllers.navbar();
            if (typeof initFn === 'function') {
                const result = await initFn();
                results.push(result);
            }
        } catch (error) {
            console.error('Error inicializando navbar controller:', error);
        }
    }
    
    if (controllers.footer) {
        try {
            const initFn = await controllers.footer();
            if (typeof initFn === 'function') {
                const result = await initFn();
                results.push(result);
            }
        } catch (error) {
            console.error('Error inicializando footer controller:', error);
        }
    }
    
    return results;
}

/**
 * Actualiza el layout actual (navbar y footer)
 */
export async function updateLayout() {
    // Evitar actualizaciones concurrentes
    if (isUpdating) {
        console.log('⏳ Layout ya está actualizando, esperando...');
        // Esperar a que termine la actualización actual
        await new Promise(resolve => {
            const checkUpdate = () => {
                if (!isUpdating) {
                    resolve();
                } else {
                    setTimeout(checkUpdate, 100);
                }
            };
            checkUpdate();
        });
        return getCurrentLayout();
    }
    
    isUpdating = true;
    
    try {
        console.log('🔄 Actualizando layout...');
        
        // 1. Obtener rol del usuario
        const role = getUserRole();
        console.log(`👤 Rol detectado: ${role}`);
        
        // 2. Determinar layout según rol
        const layout = getLayoutForRole(role);
        const layoutKey = role === 'guest' ? 'visitor' : 
                         role === 'user' ? 'user' : 'admin';
        const controllers = getControllersForLayout(layoutKey);
        
        // Guardar estado actual
        currentLayout = {
            role,
            layout,
            controllers
        };
        
        // 3. Cargar archivos HTML
        const { navbarHTML, footerHTML } = await loadLayoutFiles(layout);
        
        // 4. Insertar en el DOM
        const navbarContainer = document.getElementById('navbar');
        const footerContainer = document.getElementById('footer');
        
        if (navbarContainer) {
            navbarContainer.innerHTML = navbarHTML;
            console.log('✅ Navbar HTML insertado');
        } else {
            console.warn('⚠️ Contenedor navbar no encontrado');
        }
        
        if (footerContainer) {
            footerContainer.innerHTML = footerHTML;
            console.log('✅ Footer HTML insertado');
        } else {
            console.warn('⚠️ Contenedor footer no encontrado');
        }
        
        // 5. Inicializar controladores (con un pequeño delay para que el DOM se actualice)
        await new Promise(resolve => setTimeout(resolve, 50));
        await initLayoutControllers(controllers);
        
        // 6. Disparar evento de layout cargado
        document.dispatchEvent(new CustomEvent('layout:loaded', {
            detail: { role, layout: layoutKey }
        }));
        
        console.log(`✅ Layout cargado: ${layoutKey} (${role})`);
        
        // 7. Retornar el layout cargado
        return {
            role,
            layoutKey,
            layout,
            home: layout.home
        };
        
    } catch (error) {
        console.error('❌ Error actualizando layout:', error);
        
        // Fallback: cargar layout guest
        console.log('🔄 Cargando layout guest como fallback...');
        return await loadGuestLayout();
    } finally {
        isUpdating = false;
    }
}

/**
 * Carga el layout de invitado (fallback)
 */
async function loadGuestLayout() {
    try {
        const layout = LAYOUTS.GUEST;
        const { navbarHTML, footerHTML } = await loadLayoutFiles(layout);
        
        const navbarContainer = document.getElementById('navbar');
        const footerContainer = document.getElementById('footer');
        
        if (navbarContainer) navbarContainer.innerHTML = navbarHTML;
        if (footerContainer) footerContainer.innerHTML = footerHTML;
        
        // Inicializar controladores visitor
        const controllers = CONTROLLERS.visitor;
        await new Promise(resolve => setTimeout(resolve, 50));
        await initLayoutControllers(controllers);
        
        currentLayout = {
            role: 'guest',
            layout: LAYOUTS.GUEST,
            controllers: CONTROLLERS.visitor
        };
        
        document.dispatchEvent(new CustomEvent('layout:loaded', {
            detail: { role: 'guest', layout: 'visitor' }
        }));
        
        return {
            role: 'guest',
            layoutKey: 'visitor',
            layout: layout,
            home: layout.home
        };
        
    } catch (error) {
        console.error('❌ Error cargando layout fallback:', error);
        return null;
    }
}

/**
 * Obtiene el layout actual (síncrono)
 */
export function getCurrentLayout() {
    return { ...currentLayout };
}

/**
 * Escucha cambios de autenticación y actualiza el layout automáticamente
 */
export function initLayoutListener() {
    // Escuchar cambios de autenticación
    if (window.AuthService) {
        window.AuthService.onAuthStateChange(async (userData) => {
            console.log('🔄 Cambio de autenticación detectado:', userData ? 'logueado' : 'invitado');
            
            // Esperar un momento para que el router procese el cambio
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Actualizar layout
            const result = await updateLayout();
            
            // Si hay un home específico para el rol, navegar a él
            if (result && result.home) {
                const currentPath = window.location.pathname;
                const isHome = currentPath === '/' || currentPath === '/homeUser' || currentPath === '/index.html';
                
                if (isHome && typeof window.navigateTo === 'function') {
                    window.navigateTo(result.home);
                } else if (isHome) {
                    window.location.href = result.home;
                }
            }
        });
    }
    
    // También escuchar cambios en localStorage (por si alguien modifica directamente)
    window.addEventListener('storage', async (e) => {
        if (e.key === 'user-TYRVANGUARD') {
            console.log('🔄 Cambio en localStorage detectado');
            await updateLayout();
        }
    });
}

// Exportar funciones principales
export const LayoutManager = {
    updateLayout,
    getCurrentLayout,
    initLayoutListener,
    loadGuestLayout,
    LAYOUTS,
    CONTROLLERS
};