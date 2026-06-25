/* ========================================
   ROUTER - con protección de rutas
   ======================================== */

import { routes } from './routes.js';
import { AuthService } from '../services/authService.js';
import { LayoutManager } from '../modules/shared/loadLayout/layoutManager.js';

let isNavigating = false;

// ✅ getCurrentLayout es síncrono, no necesita await
let currentLayout = LayoutManager.getCurrentLayout();

/**
 * Inicializa el router
 */
export function initRouter() {
    // Escuchar clicks en enlaces con data-link
    document.addEventListener('click', async (e) => {
        const link = e.target.closest('[data-link]');
        if (link && !isNavigating) {
            e.preventDefault();
            e.stopPropagation();
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                await navigateTo(href);
            }
        }
    });

    // Escuchar navegación con popstate
    window.addEventListener('popstate', async () => {
        if (!isNavigating) {
            await handleRoute();
        }
    });

    // Escuchar cambios de autenticación
    if (AuthService) {
        AuthService.onAuthStateChange(async (userData) => {
            console.log('🔄 Auth change detected in router');
            
            // Actualizar layout
            const result = await LayoutManager.updateLayout();
            currentLayout = result;
            
            const path = window.location.pathname;
            const route = routes[path];
            
            // Si la ruta actual es protegida y el usuario no está autenticado
            if (route?.protected && !AuthService.isAuthenticated()) {
                await navigateTo('/iniciarSesion');
                return;
            }
            
            // Si el usuario está autenticado y está en una ruta de invitado
            if (AuthService.isAuthenticated() && (path === '/' || path === '/home')) {
                const user = AuthService.getCurrentUser();
                const home = user?.role === 'admin' ? '/dashboard' : '/homeUser';
                await navigateTo(home);
                return;
            }
            
            // Recargar ruta actual para actualizar la vista
            await handleRoute();
        });
    }

    // Escuchar cambios de layout
    document.addEventListener('layout:loaded', (e) => {
        console.log('📐 Layout actualizado:', e.detail);
        currentLayout = LayoutManager.getCurrentLayout();
    });

    // Exponer navigateTo globalmente
    window.navigateTo = navigateTo;

    // Manejar ruta inicial
    handleRoute();
}

/**
 * Navega a una ruta específica
 */
async function navigateTo(path) {
    if (isNavigating) return;
    isNavigating = true;

    window.history.pushState({}, '', path);
    await handleRoute();

    isNavigating = false;
}

/**
 * Maneja la ruta actual
 */
async function handleRoute() {
    const path = window.location.pathname;
    console.log('📍 Navegando a:', path);

    // Disparar evento antes de cambiar ruta
    document.dispatchEvent(new CustomEvent('route:changing', {
        detail: { path }
    }));

    // Buscar ruta
    let route = routes[path];

    if (!route) {
        route = routes['/404'] || routes['/'];
    }

    // Verificar si la ruta es protegida
    if (route.protected) {
        const isAuth = AuthService.isAuthenticated();
        if (!isAuth) {
            console.warn('🔒 Ruta protegida - redirigiendo a login');
            window.location.href = '/iniciarSesion';
            return;
        }
        
        // Verificar roles
        if (route.roles) {
            const userRole = AuthService.getUserRoleSync();
            if (!route.roles.includes(userRole)) {
                console.warn(`🔒 Rol ${userRole} no autorizado para ${path}`);
                window.location.href = '/';
                return;
            }
        }
    }

    try {
        // Cargar vista
        const response = await fetch(route.view);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Insertar en el DOM
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = html;
        }

        // Ejecutar controller de la vista si existe
        if (route.controller && typeof route.controller === 'function') {
            await route.controller();
        }

        // Scroll to top
        window.scrollTo(0, 0);

        console.log(`✅ Vista cargada: ${path}`);

    } catch (error) {
        console.error('❌ Error cargando ruta:', error);
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
                <div style="text-align:center;padding:60px 20px;">
                    <h1>⚔️ Error</h1>
                    <p>${error.message}</p>
                    <a href="/" data-link style="color:var(--color-primary);">Volver al inicio</a>
                </div>
            `;
        }
    }

    // Disparar evento después de cambiar ruta
    document.dispatchEvent(new CustomEvent('route:changed', {
        detail: { path }
    }));
}