/* ========================================
   NAVBAR ADMIN CONTROLLER - TYR VANGUARD
   Top Navigation para Administradores
   ======================================== */

// Estado privado
let state = {
    isMenuOpen: false,
    isScrolled: false,
    notificationCount: 0,
    isDropdownOpen: false,
    isInitialized: false
};

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del navbar de administrador
 */
export function initNavbarAdminController() {
    waitForNavbar().then(() => {
        cacheElements();

        if (!elements.navbar) {
            console.warn('⚠️ Navbar Admin no encontrado en el DOM');
            return null;
        }

        if (state.isInitialized) {
            console.log('ℹ️ Navbar Admin Controller ya inicializado');
            return;
        }

        bindEvents();
        loadAdminAvatar();

        state.isInitialized = true;
        console.log('✅ Navbar Admin Controller inicializado');
    }).catch(error => {
        console.error('❌ Error esperando navbar admin:', error);
    });

    return {
        updateNotifications,
        setAvatar,
        getState,
        reinitialize,
        closeMenu,
        closeDropdown
    };
}

/**
 * Espera a que el navbar exista en el DOM
 */
function waitForNavbar(maxAttempts = 30, interval = 100) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const checkNavbar = () => {
            const navbar = document.getElementById('navbarAdmin');

            if (navbar) {
                console.log('✅ Navbar Admin encontrado en el DOM');
                resolve();
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(new Error('Navbar Admin no encontrado después de ' + (maxAttempts * interval) + 'ms'));
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
        navbar: document.getElementById('navbarAdmin'),
        menuToggle: document.getElementById('menuToggleAdmin'),
        navActions: document.getElementById('navActionsAdmin'),
        notifBtn: document.getElementById('notifBtnAdmin'),
        notifBadge: document.getElementById('notifBadgeAdmin'),
        settingsBtn: document.getElementById('settingsBtnAdmin'),
        avatarBtn: document.getElementById('avatarBtnAdmin'),
        avatarImg: document.getElementById('avatarImgAdmin'),
        avatarWrapper: document.getElementById('avatarWrapperAdmin'),
        profileDropdown: document.getElementById('profileDropdownAdmin'),
        logoutBtn: document.getElementById('logoutBtnAdmin'),
        body: document.body
    };
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    // Menú móvil
    if (elements.menuToggle && elements.navActions) {
        const newToggle = elements.menuToggle.cloneNode(true);
        if (elements.menuToggle.parentNode) {
            elements.menuToggle.parentNode.replaceChild(newToggle, elements.menuToggle);
            elements.menuToggle = newToggle;
        }
        elements.menuToggle.addEventListener('click', toggleMenu);
    }

    // Scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Notificaciones
    if (elements.notifBtn) {
        const newNotifBtn = elements.notifBtn.cloneNode(true);
        if (elements.notifBtn.parentNode) {
            elements.notifBtn.parentNode.replaceChild(newNotifBtn, elements.notifBtn);
            elements.notifBtn = newNotifBtn;
            elements.notifBadge = newNotifBtn.querySelector('#notifBadgeAdmin');
        }
        elements.notifBtn.addEventListener('click', handleNotifications);
    }

    // Configuración
    if (elements.settingsBtn) {
        const newSettingsBtn = elements.settingsBtn.cloneNode(true);
        if (elements.settingsBtn.parentNode) {
            elements.settingsBtn.parentNode.replaceChild(newSettingsBtn, elements.settingsBtn);
            elements.settingsBtn = newSettingsBtn;
        }
        elements.settingsBtn.addEventListener('click', handleSettings);
    }

    // Avatar / Perfil
    if (elements.avatarBtn) {
        const newAvatarBtn = elements.avatarBtn.cloneNode(true);
        if (elements.avatarBtn.parentNode) {
            elements.avatarBtn.parentNode.replaceChild(newAvatarBtn, elements.avatarBtn);
            elements.avatarBtn = newAvatarBtn;
            elements.avatarImg = newAvatarBtn.querySelector('#avatarImgAdmin');
            elements.avatarWrapper = newAvatarBtn.closest('.nav-avatar-wrapper');
        }
        elements.avatarBtn.addEventListener('click', toggleDropdown);
    }

    // Cerrar sesión
    if (elements.logoutBtn) {
        const newLogoutBtn = elements.logoutBtn.cloneNode(true);
        if (elements.logoutBtn.parentNode) {
            elements.logoutBtn.parentNode.replaceChild(newLogoutBtn, elements.logoutBtn);
            elements.logoutBtn = newLogoutBtn;
        }
        elements.logoutBtn.addEventListener('click', handleLogout);
    }

    // Click fuera
    document.addEventListener('click', handleClickOutside);

    // Resize
    window.addEventListener('resize', handleResize);

    // Layout recargado
    document.addEventListener('layout:loaded', () => {
        console.log('🔄 Layout recargado, actualizando navbar admin');
        reinitialize();
    });

    // Escuchar cambios en el perfil
    document.addEventListener('profile:updated', (e) => {
        console.log('🔄 Perfil actualizado, actualizando avatar admin');
        const { photoURL, firstName, lastName } = e.detail || {};
        if (photoURL) {
            setAvatar(photoURL);
        } else if (firstName || lastName) {
            loadAdminAvatar();
        }
    });
}

/**
 * Re-inicializa el controller
 */
export function reinitialize() {
    cacheElements();

    if (!elements.navbar) {
        console.warn('⚠️ Navbar Admin no encontrado en reinitialize');
        return;
    }

    bindEvents();
    loadAdminAvatar();

    console.log('✅ Navbar Admin Controller re-inicializado');
}

/**
 * Alterna menú móvil
 */
function toggleMenu() {
    if (!elements.navActions || !elements.menuToggle) return;

    elements.navActions.classList.toggle('active');
    elements.menuToggle.classList.toggle('active');

    const icon = elements.menuToggle.querySelector('i');
    if (elements.navActions.classList.contains('active')) {
        if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        }
        state.isMenuOpen = true;
        elements.body.style.overflow = 'hidden';
        closeDropdown();
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
    if (!elements.navActions || !elements.menuToggle) return;
    if (!elements.navActions.classList.contains('active')) return;

    elements.navActions.classList.remove('active');
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
        const navbar = document.getElementById('navbarAdmin');
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
 * Toggle dropdown de perfil
 */
function toggleDropdown(e) {
    e?.stopPropagation();

    if (!elements.profileDropdown) return;

    elements.profileDropdown.classList.toggle('open');
    elements.avatarBtn?.classList.toggle('open');
    state.isDropdownOpen = elements.profileDropdown.classList.contains('open');

    if (state.isDropdownOpen && state.isMenuOpen) {
        closeMenu();
    }
}

/**
 * Cierra dropdown de perfil
 */
export function closeDropdown() {
    if (elements.profileDropdown) {
        elements.profileDropdown.classList.remove('open');
        elements.avatarBtn?.classList.remove('open');
        state.isDropdownOpen = false;
    }
}

/**
 * Click fuera
 */
function handleClickOutside(e) {
    // Menú móvil
    if (state.isMenuOpen) {
        const isClickInsideMenu = elements.navActions?.contains(e.target);
        const isClickOnToggle = elements.menuToggle?.contains(e.target);

        if (!isClickInsideMenu && !isClickOnToggle) {
            closeMenu();
        }
    }

    // Dropdown
    if (state.isDropdownOpen) {
        const isClickInside = elements.avatarWrapper?.contains(e.target);
        const isClickOnDropdown = elements.profileDropdown?.contains(e.target);

        if (!isClickInside && !isClickOnDropdown) {
            closeDropdown();
        }
    }
}

/**
 * Resize
 */
function handleResize() {
    if (window.innerWidth > 850 && state.isMenuOpen) {
        closeMenu();
    }
}

/**
 * Actualiza badge de notificaciones
 */
function updateBadge() {
    if (!elements.notifBadge) return;

    if (state.notificationCount > 0) {
        elements.notifBadge.textContent = state.notificationCount;
        elements.notifBadge.classList.remove('empty');
    } else {
        elements.notifBadge.classList.add('empty');
    }
}

/**
 * Actualiza contador de notificaciones
 */
export function updateNotifications(count) {
    state.notificationCount = count;
    updateBadge();
}

/**
 * Carga avatar del administrador desde localStorage
 */
function loadAdminAvatar() {
    try {
        // Obtener sesión del localStorage (admin_session)
        const sessionData = localStorage.getItem('admin_session');
        
        if (!sessionData) {
            console.warn('⚠️ No hay sesión de admin en localStorage');
            setDefaultAvatar();
            return;
        }

        const admin = JSON.parse(sessionData);
        console.log('👤 Admin en sesión:', admin);

        if (!elements.avatarImg) {
            console.warn('⚠️ Elemento avatarImgAdmin no encontrado');
            return;
        }

        // 1. Si tiene photoURL (base64 o URL)
        if (admin.photoURL && admin.photoURL.startsWith('data:image/')) {
            elements.avatarImg.src = admin.photoURL;
            console.log('✅ Avatar admin cargado desde base64');
            return;
        }

        if (admin.photoURL) {
            elements.avatarImg.src = admin.photoURL;
            console.log('✅ Avatar admin cargado desde URL');
            return;
        }

        // 2. Si no tiene photoURL, generar con iniciales
        if (admin.fullName) {
            const name = admin.fullName;
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            elements.avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || 'A')}&background=1a2f4a&color=7cd5d5&size=64&bold=true&font-size=0.5`;
            console.log('✅ Avatar admin generado con iniciales:', initials);
            return;
        }

        // 3. Fallback
        setDefaultAvatar();

    } catch (error) {
        console.error('❌ Error cargando avatar admin:', error);
        setDefaultAvatar();
    }
}

/**
 * Establece avatar por defecto
 */
function setDefaultAvatar() {
    if (elements.avatarImg) {
        elements.avatarImg.src = `https://ui-avatars.com/api/?name=A&background=1a2f4a&color=7cd5d5&size=64&bold=true`;
    }
}

/**
 * Establece avatar desde otros controllers
 */
export function setAvatar(url) {
    if (elements.avatarImg && url) {
        elements.avatarImg.src = url;
        console.log('🖼️ Avatar admin actualizado manualmente');
    }
}

/**
 * Maneja click en notificaciones
 */
function handleNotifications(e) {
    e.stopPropagation();

    showToast(`📬 Tienes ${state.notificationCount} notificaciones sin leer`);

    if (state.notificationCount > 0) {
        state.notificationCount = 0;
        updateBadge();
    }
}

/**
 * Maneja click en configuración
 */
function handleSettings(e) {
    e.stopPropagation();

    const icon = elements.settingsBtn?.querySelector('i');
    if (icon) {
        icon.style.transition = 'transform 0.5s ease';
        icon.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            icon.style.transform = 'rotate(0deg)';
        }, 500);
    }

    showToast('⚙️ Abriendo configuración...');

    if (typeof window.navigateTo === 'function') {
        setTimeout(() => {
            window.navigateTo('/configuracion');
        }, 500);
    }
}

/**
 * Maneja cierre de sesión
 */
async function handleLogout(e) {
    e.preventDefault();
    
    if (!confirm('¿Estás seguro de que deseas cerrar sesión como administrador?')) {
        return;
    }
    
    try {
        closeDropdown();
        
        if (elements.logoutBtn) {
            elements.logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cerrando...';
            elements.logoutBtn.style.pointerEvents = 'none';
        }
        
        if (window.AuthService) {
            await window.AuthService.logout();
        }
        
        // Limpiar sesión admin
        localStorage.removeItem('admin_session');
        
        if (window.reloadLayout) {
            console.log('🔄 Recargando layout después de logout admin...');
            await window.reloadLayout();
        } else {
            console.warn('⚠️ reloadLayout no disponible, recargando página...');
            window.location.reload();
            return;
        }
        
        if (typeof window.navigateTo === 'function') {
            await window.navigateTo('/iniciarSesion');
        } else {
            window.location.href = '/iniciarSesion';
        }
        
    } catch (error) {
        console.error('❌ Error en logout:', error);
        showToast('Error al cerrar sesión, recargando...', 'error');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

/**
 * Muestra toast de notificación
 */
function showToast(message, type = 'info') {
    const oldToast = document.querySelector('.toast-notification-admin');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification-admin';

    const colors = {
        success: '#7cd5d5',
        info: '#4BA6A6',
        warning: '#FFB347',
        error: '#ff6b6b'
    };

    toast.style.cssText = `
        position: fixed;
        top: 74px;
        right: 20px;
        background: var(--color-surface-container);
        color: ${colors[type] || colors.info};
        padding: 12px 20px;
        border-radius: var(--border-radius-lg);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        border: 1px solid ${colors[type] || colors.info};
        z-index: 9999;
        max-width: 90%;
        animation: slideInRightAdmin 0.4s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRightAdmin 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

/**
 * Obtiene estado actual
 */
export function getState() {
    return { ...state };
}

// ============================================
// INYECTAR ANIMACIONES
// ============================================

const toastStylesAdmin = document.createElement('style');
toastStylesAdmin.textContent = `
    @keyframes slideInRightAdmin {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutRightAdmin {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(30px); }
    }
`;
document.head.appendChild(toastStylesAdmin);

// Exponer funciones globalmente
window.showToastAdmin = showToast;
window.setNavbarAdminAvatar = setAvatar;