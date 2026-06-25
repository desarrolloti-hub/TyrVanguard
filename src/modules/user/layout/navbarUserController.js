/* ========================================
   NAVBAR USER CONTROLLER - TYR VANGUARD
   Top Navigation para usuarios logueados
   ======================================== */

// Estado privado
let state = {
    isInitialized: false,
    isScrolled: false,
    notificationCount: 3,
    isDropdownOpen: false
};

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del navbar de usuario
 */
export function initNavbarUserController() {
    waitForNavbar().then(() => {
        cacheElements();

        if (!elements.navbar) {
            console.warn('⚠️ Navbar User no encontrado en el DOM');
            return null;
        }

        if (state.isInitialized) {
            console.log('ℹ️ Navbar User Controller ya inicializado');
            return;
        }

        bindEvents();
        handleScroll();
        loadUserAvatar();

        state.isInitialized = true;
        console.log('✅ Navbar User Controller inicializado');
    }).catch(error => {
        console.error('❌ Error esperando navbar user:', error);
    });

    return {
        updateNotifications,
        setAvatar,
        getState,
        reinitialize,
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
            const navbar = document.getElementById('topNav');

            if (navbar) {
                console.log('✅ Navbar User encontrado en el DOM');
                resolve();
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(new Error('Navbar User no encontrado después de ' + (maxAttempts * interval) + 'ms'));
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
        navbar: document.getElementById('topNav'),
        notifBtn: document.getElementById('notifBtn'),
        notifBadge: document.getElementById('notifBadge'),
        settingsBtn: document.getElementById('settingsBtn'),
        avatarBtn: document.getElementById('avatarBtn'),
        avatarImg: document.getElementById('avatarImg'),
        body: document.body
    };
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    // Scroll - efecto de cambio de color
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Notificaciones
    if (elements.notifBtn) {
        const newNotifBtn = elements.notifBtn.cloneNode(true);
        if (elements.notifBtn.parentNode) {
            elements.notifBtn.parentNode.replaceChild(newNotifBtn, elements.notifBtn);
            elements.notifBtn = newNotifBtn;
            elements.notifBadge = newNotifBtn.querySelector('#notifBadge');
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
            elements.avatarImg = newAvatarBtn.querySelector('#avatarImg');
        }
        elements.avatarBtn.addEventListener('click', handleAvatarClick);
    }

    // Cambio de ruta (disparado por router)
    document.addEventListener('route:changed', () => {
        handleScroll();
    });

    // Click fuera del dropdown
    document.addEventListener('click', handleClickOutside);

    // Layout recargado
    document.addEventListener('layout:loaded', () => {
        console.log('🔄 Layout recargado, actualizando navbar user');
        reinitialize();
    });
}

/**
 * Re-inicializa el controller
 */
export function reinitialize() {
    cacheElements();

    if (!elements.navbar) {
        console.warn('⚠️ Navbar User no encontrado en reinitialize');
        return;
    }

    bindEvents();
    handleScroll();
    loadUserAvatar();

    console.log('✅ Navbar User Controller re-inicializado');
}

/**
 * Maneja evento scroll
 */
function handleScroll() {
    if (!elements.navbar) {
        const navbar = document.getElementById('topNav');
        if (navbar) {
            elements.navbar = navbar;
        } else {
            return;
        }
    }

    const isNowScrolled = window.scrollY > 10;

    if (isNowScrolled && !state.isScrolled) {
        elements.navbar.classList.add('scrolled');
        state.isScrolled = true;
    } else if (!isNowScrolled && state.isScrolled) {
        elements.navbar.classList.remove('scrolled');
        state.isScrolled = false;
    }
}

/**
 * Maneja click en notificaciones
 */
function handleNotifications(e) {
    e.stopPropagation();

    // Mostrar notificación toast
    showNotification(`📬 Tienes ${state.notificationCount} notificaciones sin leer`);

    // Marcar como leídas
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

    // Efecto de rotación en el icono
    const icon = elements.settingsBtn?.querySelector('.material-symbols-outlined');
    if (icon) {
        icon.style.transition = 'transform 0.5s ease';
        icon.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            icon.style.transform = 'rotate(0deg)';
        }, 500);
    }

    showNotification('⚙️ Abriendo configuración...');

    // Navegar a configuración si existe ruta
    if (typeof window.navigateTo === 'function') {
        setTimeout(() => {
            window.navigateTo('/configuracion');
        }, 500);
    }
}

/**
 * Maneja click en avatar
 */
function handleAvatarClick(e) {
    e.stopPropagation();

    // Crear o toggle dropdown
    toggleDropdown();
}

/**
 * Crea o togglea el dropdown de perfil
 */
function toggleDropdown() {
    // Verificar si ya existe dropdown
    let dropdown = document.querySelector('.profile-dropdown');

    if (dropdown) {
        // Toggle
        dropdown.classList.toggle('open');
        state.isDropdownOpen = dropdown.classList.contains('open');
        return;
    }

    // Crear dropdown
    dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    dropdown.innerHTML = `
        <a href="/perfil" data-link>
            <span class="material-symbols-outlined">person</span>
            Mi Perfil
        </a>
        <a href="/dashboard" data-link>
            <span class="material-symbols-outlined">dashboard</span>
            Dashboard
        </a>
        <a href="/logros" data-link>
            <span class="material-symbols-outlined">emoji_events</span>
            Mis Logros
        </a>
        <div class="dropdown-divider"></div>
        <a href="/configuracion" data-link>
            <span class="material-symbols-outlined">settings</span>
            Configuración
        </a>
        <a href="#" class="logout-item" id="logoutDropdownBtn">
            <span class="material-symbols-outlined">logout</span>
            Cerrar Sesión
        </a>
    `;

    // Posicionar debajo del avatar
    const avatarRect = elements.avatarBtn.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = (avatarRect.bottom + 8) + 'px';
    dropdown.style.right = (window.innerWidth - avatarRect.right) + 'px';

    document.body.appendChild(dropdown);

    // Abrir con animación
    requestAnimationFrame(() => {
        dropdown.classList.add('open');
        state.isDropdownOpen = true;
    });

    // Evento para cerrar sesión
    const logoutBtn = dropdown.querySelector('#logoutDropdownBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // Eventos para enlaces con data-link
    dropdown.querySelectorAll('[data-link]').forEach(link => {
        link.addEventListener('click', () => {
            closeDropdown();
        });
    });
}

/**
 * Cierra el dropdown de perfil
 */
export function closeDropdown() {
    const dropdown = document.querySelector('.profile-dropdown');
    if (dropdown) {
        dropdown.classList.remove('open');
        state.isDropdownOpen = false;
        setTimeout(() => {
            dropdown.remove();
        }, 300);
    }
}

/**
 * Maneja click fuera del dropdown
 */
function handleClickOutside(e) {
    if (!state.isDropdownOpen) return;

    const isClickInside = elements.avatarBtn?.contains(e.target);
    const isClickOnDropdown = document.querySelector('.profile-dropdown')?.contains(e.target);

    if (!isClickInside && !isClickOnDropdown) {
        closeDropdown();
    }
}

/**
 * Actualiza el badge de notificaciones
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
 * Actualiza el contador de notificaciones desde otros controllers
 */
export function updateNotifications(count) {
    state.notificationCount = count;
    updateBadge();
}

/**
 * Carga el avatar del usuario
 */
async function loadUserAvatar() {
    try {
        if (window.AuthService) {
            const user = await window.AuthService.getCurrentUser();
            if (user && user.avatar && elements.avatarImg) {
                elements.avatarImg.src = user.avatar;
            } else if (user && user.name && elements.avatarImg) {
                // Fallback con iniciales
                const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                elements.avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || 'U')}&background=1a2f4a&color=7cd5d5&size=64`;
            }
        }
    } catch (error) {
        console.error('Error cargando avatar:', error);
    }
}

/**
 * Establece el avatar desde otros controllers
 */
export function setAvatar(url) {
    if (elements.avatarImg) {
        elements.avatarImg.src = url;
    }
}

/**
 * Maneja cierre de sesión
 */
async function handleLogout() {
    try {
        if (window.AuthService) {
            await window.AuthService.logout();
        }
        state.currentUser = null;
        closeDropdown();
        window.location.href = '/iniciarSesion';
    } catch (error) {
        console.error('Error en logout:', error);
    }
}

/**
 * Muestra notificación toast
 */
function showNotification(message, type = 'info') {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';

    const colors = {
        success: '#7cd5d5',
        info: '#4BA6A6',
        warning: '#FFB347',
        error: '#ff6b6b'
    };

    toast.style.cssText = `
        position: fixed;
        top: 60px;
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
        animation: slideInRight 0.4s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease forwards';
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
// INYECTAR ANIMACIONES DE TOAST
// ============================================

const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(30px);
        }
    }
`;
document.head.appendChild(toastStyles);

// Exponer funciones globalmente
window.showNotification = showNotification;