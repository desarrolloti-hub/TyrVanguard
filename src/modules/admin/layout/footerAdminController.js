/* ========================================
   FOOTER ADMIN CONTROLLER - TYR VANGUARD
   Bottom Navigation para Administradores
   ======================================== */

// Estado privado
let state = {
    activeNav: 'dashboard',
    isInitialized: false
};

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del footer de administrador
 */
export function initFooterAdminController() {
    waitForFooter().then(() => {
        cacheElements();

        if (!elements.footer) {
            console.warn('Footer Admin no encontrado en el DOM');
            return null;
        }

        if (state.isInitialized) {
            console.log('Footer Admin Controller ya inicializado');
            return;
        }

        bindEvents();
        setActiveFromPath();

        state.isInitialized = true;
        console.log('Footer Admin Controller inicializado');
    }).catch(error => {
        console.error('Error esperando footer admin:', error);
    });

    return {
        setActive,
        getActive,
        getState,
        reinitialize
    };
}

/**
 * Espera a que el footer exista en el DOM
 */
function waitForFooter(maxAttempts = 30, interval = 100) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const checkFooter = () => {
            const footer = document.getElementById('bottomNavAdmin');

            if (footer) {
                console.log('Footer Admin encontrado en el DOM');
                resolve();
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(new Error('Footer Admin no encontrado después de ' + (maxAttempts * interval) + 'ms'));
                } else {
                    setTimeout(checkFooter, interval);
                }
            }
        };

        checkFooter();
    });
}

/**
 * Cachea elementos del DOM
 */
function cacheElements() {
    elements = {
        footer: document.getElementById('bottomNavAdmin'),
        navItems: document.querySelectorAll('.bottom-nav-admin .nav-item')
    };
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    if (!elements.navItems || elements.navItems.length === 0) return;

    elements.navItems.forEach(item => {
        const newItem = item.cloneNode(true);
        if (item.parentNode) {
            item.parentNode.replaceChild(newItem, item);
        }

        newItem.addEventListener('click', handleNavClick);
    });

    elements.navItems = document.querySelectorAll('.bottom-nav-admin .nav-item');

    document.addEventListener('route:changed', () => {
        setActiveFromPath();
    });

    document.addEventListener('layout:loaded', () => {
        console.log('Layout recargado, actualizando footer admin');
        reinitialize();
    });
}

/**
 * Re-inicializa el controller
 */
export function reinitialize() {
    cacheElements();

    if (!elements.footer) {
        console.warn('Footer Admin no encontrado en reinitialize');
        return;
    }

    bindEvents();
    setActiveFromPath();

    console.log('Footer Admin Controller re-inicializado');
}

/**
 * Maneja click en items de navegación
 */
function handleNavClick(e) {
    const target = e.currentTarget;
    const nav = target.dataset.nav;

    if (!nav) return;

    elements.navItems.forEach(item => {
        item.classList.remove('active');
    });

    target.classList.add('active');
    state.activeNav = nav;

    document.dispatchEvent(new CustomEvent('nav:changed', {
        detail: { nav }
    }));

    console.log('Navegando a:', nav);

    const href = target.getAttribute('href');
    if (href && href !== '#' && !href.startsWith('http')) {
        if (typeof window.navigateTo === 'function') {
            e.preventDefault();
            window.navigateTo(href);
        }
    }
}

/**
 * Establece el item activo por nombre
 */
export function setActive(navName) {
    if (!elements.navItems || elements.navItems.length === 0) return;

    let found = false;

    elements.navItems.forEach(item => {
        if (item.dataset.nav === navName) {
            item.classList.add('active');
            state.activeNav = navName;
            found = true;
        } else {
            item.classList.remove('active');
        }
    });

    if (!found) {
        console.warn('Nav item "' + navName + '" no encontrado');
    }

    return found;
}

/**
 * Obtiene el nav activo actual
 */
export function getActive() {
    return state.activeNav;
}

/**
 * Establece activo basado en la ruta actual
 */
function setActiveFromPath() {
    const path = window.location.pathname;

    const routeMap = {
        '/homeAdmin': 'dashboard',
        '/': 'dashboard',
        '/admin/dashboard': 'dashboard',
        '/homeAdmin#users': 'users',
        '/admin/users': 'users',
        '/batallas': 'battles',
        '/crearBatallas': 'battles',
        '/metas': 'goals',
        '/crearMetas': 'goals'
    };

    let navName = routeMap[path];

    if (!navName) {
        for (const [route, nav] of Object.entries(routeMap)) {
            if (path.startsWith(route) && route !== '/' && route !== '/homeAdmin') {
                navName = nav;
                break;
            }
        }
    }

    if (navName) {
        setActive(navName);
    }
}

/**
 * Obtiene estado completo
 */
export function getState() {
    return { ...state };
}

// Exponer funciones globalmente
window.footerAdmin = {
    setActive,
    getActive,
    navigateTo: (navName) => {
        const item = document.querySelector('.bottom-nav-admin .nav-item[data-nav="' + navName + '"]');
        if (item) {
            item.click();
        }
    }
};