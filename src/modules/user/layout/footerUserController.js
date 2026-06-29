/* ========================================
   FOOTER USER CONTROLLER - TYR VANGUARD
   Bottom Navigation (Navegación Principal)
   ======================================== */

// Estado privado
let state = {
    activeNav: 'home',
    isInitialized: false
};

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del footer de usuario
 */
export function initFooterUserController() {
    waitForFooter().then(() => {
        cacheElements();

        if (!elements.footer) {
            console.warn('Footer User no encontrado en el DOM');
            return null;
        }

        if (state.isInitialized) {
            console.log('Footer User Controller ya inicializado');
            return;
        }

        bindEvents();
        setActiveFromPath();

        state.isInitialized = true;
        console.log('Footer User Controller inicializado');
    }).catch(error => {
        console.error('Error esperando footer user:', error);
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
            const footer = document.getElementById('bottomNav');

            if (footer) {
                console.log('Footer User encontrado en el DOM');
                resolve();
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(new Error('Footer User no encontrado después de ' + (maxAttempts * interval) + 'ms'));
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
        footer: document.getElementById('bottomNav'),
        navItems: document.querySelectorAll('.nav-item')
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

    elements.navItems = document.querySelectorAll('.nav-item');

    document.addEventListener('route:changed', () => {
        setActiveFromPath();
    });

    document.addEventListener('layout:loaded', () => {
        console.log('Layout recargado, actualizando footer user');
        reinitialize();
    });
}

/**
 * Re-inicializa el controller
 */
export function reinitialize() {
    cacheElements();

    if (!elements.footer) {
        console.warn('Footer User no encontrado en reinitialize');
        return;
    }

    bindEvents();
    setActiveFromPath();

    console.log('Footer User Controller re-inicializado');
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
        '/dashboard': 'home',
        '/': 'home',
        '/batallas': 'battles',
        '/crearBatallas': 'battles',
        '/metas': 'goals',
        '/crearMetas': 'goals',
        '/diario': 'diary',
        '/crearDiario': 'diary'
    };

    let navName = routeMap[path];

    if (!navName) {
        for (const [route, nav] of Object.entries(routeMap)) {
            if (path.startsWith(route) && route !== '/' && route !== '/dashboard') {
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
window.footerUser = {
    setActive,
    getActive,
    navigateTo: (navName) => {
        const item = document.querySelector('.nav-item[data-nav="' + navName + '"]');
        if (item) {
            item.click();
        }
    }
};