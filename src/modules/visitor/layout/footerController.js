/* ========================================
   FOOTER CONTROLLER - TYR VANGUARD
   Controlador del footer con SPA y Vite
   ======================================== */

// Estado privado
let state = {
    isInitialized: false
};

// Elementos DOM cacheados
let elements = {};

/**
 * Inicializa el controlador del footer
 */
export function initFooterController() {
    waitForFooter().then(() => {
        cacheElements();

        if (!elements.footer) {
            console.warn('⚠️ Footer no encontrado en el DOM');
            return null;
        }

        if (state.isInitialized) {
            console.log('ℹ️ Footer Controller ya inicializado');
            return;
        }

        bindEvents();
        updateYear();

        state.isInitialized = true;
        console.log('✅ Footer Controller inicializado');
    }).catch(error => {
        console.error('❌ Error esperando footer:', error);
    });

    return {
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
            const footer = document.getElementById('footer');
            const newsletterForm = document.getElementById('newsletterForm');

            if (footer) {
                console.log('✅ Footer encontrado en el DOM');
                resolve();
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(new Error('Footer no encontrado después de ' + (maxAttempts * interval) + 'ms'));
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
        footer: document.getElementById('footer'),
        newsletterForm: document.getElementById('newsletterForm'),
        emailInput: document.getElementById('newsletterEmail'),
        yearSpan: document.getElementById('footerYear')
    };
}

/**
 * Vincula eventos del DOM
 */
function bindEvents() {
    // Newsletter
    if (elements.newsletterForm && elements.emailInput) {
        const newForm = elements.newsletterForm.cloneNode(true);
        if (elements.newsletterForm.parentNode) {
            elements.newsletterForm.parentNode.replaceChild(newForm, elements.newsletterForm);
            elements.newsletterForm = newForm;
            elements.emailInput = newForm.querySelector('#newsletterEmail');
        }

        elements.newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }

    // Redes sociales - tracking
    document.querySelectorAll('.footer-social a').forEach(link => {
        link.addEventListener('click', handleSocialClick);
    });

    // Logo click
    const logo = document.querySelector('.footer-logo');
    if (logo) {
        logo.addEventListener('click', handleLogoClick);
    }

    // Layout recargado
    document.addEventListener('layout:loaded', () => {
        console.log('🔄 Layout recargado, actualizando referencias del footer');
        reinitialize();
    });
}

/**
 * Re-inicializa el controller
 */
export function reinitialize() {
    cacheElements();

    if (!elements.footer) {
        console.warn('⚠️ Footer no encontrado en reinitialize');
        return;
    }

    bindEvents();
    updateYear();

    console.log('✅ Footer Controller re-inicializado');
}

/**
 * Maneja el envío del newsletter
 */
function handleNewsletterSubmit(e) {
    e.preventDefault();

    const email = elements.emailInput?.value.trim();

    if (!email) {
        showToast('📧 Por favor, ingresa tu correo electrónico', 'warning');
        elements.emailInput?.focus();
        return;
    }

    if (!isValidEmail(email)) {
        showToast('❌ Por favor, ingresa un correo válido', 'error');
        elements.emailInput?.focus();
        return;
    }

    // Simular envío
    const btn = elements.newsletterForm.querySelector('.newsletter-btn');
    const originalHtml = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    setTimeout(() => {
        showToast('✅ ¡Te has suscrito exitosamente!', 'success');
        elements.emailInput.value = '';
        btn.innerHTML = '<i class="fas fa-check"></i>';

        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }, 2000);

        saveSubscriber(email);

    }, 1500);
}

/**
 * Valida formato de email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Guarda suscriptor (simulación)
 */
function saveSubscriber(email) {
    try {
        const subscribers = JSON.parse(localStorage.getItem('tyr_subscribers') || '[]');
        if (!subscribers.includes(email)) {
            subscribers.push(email);
            localStorage.setItem('tyr_subscribers', JSON.stringify(subscribers));
            console.log('💾 Suscriptor guardado:', email);
        }
    } catch (error) {
        console.error('Error guardando suscriptor:', error);
    }
}

/**
 * Muestra notificación toast
 */
function showToast(message, type = 'info') {
    const oldToast = document.querySelector('.toast-message');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-message';

    const colors = {
        success: '#7cd5d5',
        warning: '#FFB347',
        error: '#ff6b6b',
        info: '#4BA6A6'
    };

    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-surface-container);
        color: ${colors[type] || colors.info};
        padding: 14px 28px;
        border-radius: var(--border-radius-lg);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        border: 1px solid ${colors[type] || colors.info};
        z-index: 9999;
        max-width: 90%;
        text-align: center;
        animation: toastSlideUp 0.4s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideDown 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

/**
 * Actualiza el año en el copyright
 */
function updateYear() {
    if (elements.yearSpan) {
        elements.yearSpan.textContent = new Date().getFullYear();
    }
}

/**
 * Maneja click en redes sociales
 */
function handleSocialClick(e) {
    const social = e.currentTarget.getAttribute('aria-label') || 'social';
    console.log(`🔗 Red social: ${social}`);
}

/**
 * Maneja click en el logo
 */
function handleLogoClick(e) {
    if (typeof window.navigateTo === 'function') {
        e.preventDefault();
        window.navigateTo('/');
    } else {
        window.location.href = '/';
    }
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
    @keyframes toastSlideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes toastSlideDown {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
    }
`;
document.head.appendChild(toastStyles);

// Exponer funciones globalmente
window.showToast = showToast;
window.saveSubscriber = saveSubscriber;