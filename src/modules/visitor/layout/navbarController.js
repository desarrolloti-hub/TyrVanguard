/* ========================================
   NAVBAR CONTROLLER - TYR VANGUARD
   Controlador del navbar con SPA y Vite
   ======================================== */

// Estado privado
let state = {
    isMenuOpen: false,
    isScrolled: false,
    currentUser: null,
    isInitialized: false
};

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del navbar
 */
export function initNavbarController() {
    waitForNavbar().then(() => {
        cacheElements();

        if (!elements.navbar) {
            console.warn('⚠️ Navbar no encontrado en el DOM');
            return null;
        }

        if (state.isInitialized) {
            console.log('ℹ️ Navbar Controller ya inicializado');
            return;
        }

        bindEvents();
        setActiveLink();
        handleScroll();
        loadUserSession();

        state.isInitialized = true;
        console.log('✅ Navbar Controller inicializado');
    }).catch(error => {
        console.error('❌ Error esperando navbar:', error);
    });

    return {
        updateUser,
        closeMenu,
        setActiveLink,
        getState,
        reinitialize
    };
}

/**
 * Espera a que el navbar exista en el DOM
 */
function waitForNavbar(maxAttempts = 30, interval = 100) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const checkNavbar = () => {
            const navbar = document.getElementById('navbar');
            const navMenu = document.getElementById('navMenu');

            if (navbar && navMenu) {
                console.log('✅ Navbar encontrado en el DOM');
                resolve();
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(new Error('Navbar no encontrado después de ' + (maxAttempts * interval) + 'ms'));
                } else {
                    setTimeout(checkNavbar, interval);
                }
            }
        };

        checkNavbar();
    });
}

/**
 * Cachea elementos del DOM
 */
function cacheElements() {
    elements = {
        navbar: document.getElementById('navbar'),
        menuToggle: document.getElementById('menuToggle'),
        navMenu: document.getElementById('navMenu'),
        navLinks: document.querySelectorAll('.nav-links a'),
        body: document.body
    };
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    // Menú móvil
    if (elements.menuToggle && elements.navMenu) {
        const newToggle = elements.menuToggle.cloneNode(true);
        if (elements.menuToggle.parentNode) {
            elements.menuToggle.parentNode.replaceChild(newToggle, elements.menuToggle);
            elements.menuToggle = newToggle;
        }
        elements.menuToggle.addEventListener('click', toggleMenu);
    }

    // Scroll - efecto de cambio de color
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Click en enlaces
    if (elements.navLinks) {
        elements.navLinks.forEach(link => {
            link.removeEventListener('click', handleLinkClick);
            link.addEventListener('click', handleLinkClick);
        });
    }

    // Cambio de ruta (disparado por router)
    document.addEventListener('route:changed', () => {
        setActiveLink();
        closeMenu();
        handleScroll();
    });

    // Click fuera del menú
    document.addEventListener('click', handleClickOutside);

    // Resize
    window.addEventListener('resize', handleResize);

    // Layout recargado
    document.addEventListener('layout:loaded', () => {
        console.log('🔄 Layout recargado, actualizando referencias');
        reinitialize();
    });
}

/**
 * Re-inicializa el controller
 */
export function reinitialize() {
    cacheElements();

    if (!elements.navbar) {
        console.warn('⚠️ Navbar no encontrado en reinitialize');
        return;
    }

    bindEvents();
    setActiveLink();
    handleScroll();

    console.log('✅ Navbar Controller re-inicializado');
}

/**
 * Alterna menú móvil
 */
function toggleMenu() {
    if (!elements.navMenu || !elements.menuToggle) return;

    elements.navMenu.classList.toggle('active');
    elements.menuToggle.classList.toggle('active');

    const icon = elements.menuToggle.querySelector('i');
    if (elements.navMenu.classList.contains('active')) {
        if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        }
        state.isMenuOpen = true;
        elements.body.style.overflow = 'hidden';
    } else {
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
        state.isMenuOpen = false;
        elements.body.style.overflow = '';
    }
}

/**
 * Cierra menú móvil
 */
export function closeMenu() {
    if (!elements.navMenu || !elements.menuToggle) return;
    if (!elements.navMenu.classList.contains('active')) return;

    elements.navMenu.classList.remove('active');
    elements.menuToggle.classList.remove('active');

    const icon = elements.menuToggle.querySelector('i');
    if (icon) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
    state.isMenuOpen = false;
    elements.body.style.overflow = '';
}

/**
 * Maneja evento scroll
 */
function handleScroll() {
    if (!elements.navbar) {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            elements.navbar = navbar;
        } else {
            return;
        }
    }

    const isNowScrolled = window.scrollY > 30;

    if (isNowScrolled && !state.isScrolled) {
        elements.navbar.classList.add('scrolled');
        state.isScrolled = true;
    } else if (!isNowScrolled && state.isScrolled) {
        elements.navbar.classList.remove('scrolled');
        state.isScrolled = false;
    }
}

/**
 * Click fuera del menú
 */
function handleClickOutside(event) {
    if (!state.isMenuOpen) return;

    const isClickInsideMenu = elements.navMenu?.contains(event.target);
    const isClickOnToggle = elements.menuToggle?.contains(event.target);

    if (!isClickInsideMenu && !isClickOnToggle) {
        closeMenu();
    }
}

/**
 * Resize de ventana
 */
function handleResize() {
    if (window.innerWidth > 850 && state.isMenuOpen) {
        closeMenu();
    }
}

/**
 * Click en enlaces del navbar
 */
function handleLinkClick(e) {
    closeMenu();

    const link = e.currentTarget;
    const href = link.getAttribute('href');

    if (typeof window.navigateTo === 'function' && href && !href.startsWith('http') && href !== '#') {
        e.preventDefault();
        addLoadingEffect(link);
        window.navigateTo(href);
    }
}

/**
 * Marca enlace activo según ruta actual
 */
export function setActiveLink() {
    if (!elements.navLinks || elements.navLinks.length === 0) return;

    const currentPath = window.location.pathname;

    elements.navLinks.forEach(link => {
        let linkPath = link.getAttribute('href');

        if (!linkPath || linkPath === '#') return;

        link.classList.remove('active');

        if (currentPath === '/' && (linkPath === '/' || linkPath === '/index.html')) {
            link.classList.add('active');
        } else if (linkPath === currentPath) {
            link.classList.add('active');
        } else if (linkPath !== '/' && currentPath.startsWith(linkPath)) {
            link.classList.add('active');
        } else if (linkPath.includes('.html') && currentPath.includes(linkPath)) {
            link.classList.add('active');
        }
    });
}

/**
 * Efecto de carga en enlace
 */
function addLoadingEffect(link) {
    link.classList.add('loading');
    setTimeout(() => {
        link.classList.remove('loading');
    }, 500);
}

/**
 * Carga sesión de usuario
 */
async function loadUserSession() {
    try {
        if (window.AuthService) {
            const user = await window.AuthService.getCurrentUser();
            if (user && user.isLoggedIn) {
                state.currentUser = user;
                updateNavbarForLoggedUser(user);
            }
        }
    } catch (error) {
        console.error('Error cargando sesión:', error);
    }
}

/**
 * Actualiza navbar para usuario logueado
 */
function updateNavbarForLoggedUser(user) {
    const navMenu = elements.navMenu;
    if (!navMenu) return;

    const loginItem = navMenu.querySelector('li:last-child');
    if (!loginItem) return;

    const avatarUrl = user.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=1a2f4a&color=7cd5d5`;

    loginItem.innerHTML = `
        <div class="user-menu">
            <img src="${avatarUrl}" class="user-avatar" alt="Avatar">
            <span class="user-name">${user.name || 'Usuario'}</span>
            <i class="fas fa-chevron-down"></i>
        </div>
        <ul class="user-dropdown">
            <li><a href="/perfil"><i class="fas fa-user"></i> Mi Perfil</a></li>
            <li><a href="/dashboard"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
            <li><button class="logout-btn" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</button></li>
        </ul>
    `;

    loginItem.classList.add('has-dropdown');

    const userMenu = loginItem.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            loginItem.classList.toggle('dropdown-open');
        });
    }

    const logoutBtn = loginItem.querySelector('#logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    elements.navLinks = document.querySelectorAll('.nav-links a');

    elements.navLinks.forEach(link => {
        link.removeEventListener('click', handleLinkClick);
        link.addEventListener('click', handleLinkClick);
    });

    document.addEventListener('click', () => {
        loginItem.classList.remove('dropdown-open');
    });
}

/**
 * Cierre de sesión
 */
async function handleLogout() {
    try {
        if (window.AuthService) {
            await window.AuthService.logout();
        }
        state.currentUser = null;
        window.location.href = '/iniciarSesion';
    } catch (error) {
        console.error('Error en logout:', error);
    }
}

/**
 * Actualiza usuario desde otros controllers
 */
export function updateUser(user) {
    state.currentUser = user;
    if (user && user.isLoggedIn) {
        updateNavbarForLoggedUser(user);
    }
}

/**
 * Obtiene estado actual
 */
export function getState() {
    return { ...state };
}

/**
 * Forzar actualización del estado scroll
 */
export function refreshScrollState() {
    handleScroll();
}