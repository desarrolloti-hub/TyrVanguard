/* ========================================
   LOGIN CONTROLLER - Solo maneja eventos del formulario
   NO contiene lógica de negocio
   ======================================== */

import { AuthService } from '../../../services/authService.js';

// ============ CONFIGURACIÓN DE SWEETALERT TOAST ============
const SWEET_CONFIG = {
    toast: true,
    position: 'top-end',
    timer: 4000,
    timerProgressBar: true,
    showConfirmButton: false,
    showCancelButton: false,
    showCloseButton: true,
    customClass: {
        popup: 'tyr-popup',
        title: 'tyr-title',
        htmlContainer: 'tyr-html',
        icon: 'tyr-icon',
        closeButton: 'tyr-close-btn',
        timerProgressBar: 'tyr-progress-bar'
    },
    background: 'rgba(10, 26, 46, 0.98)',
    backdrop: 'rgba(4, 11, 20, 0.6)',
    didOpen: (popup) => {
        // Aplicar estilos adicionales para toast
        popup.style.borderLeft = '3px solid #7cd5d5';
        popup.style.clipPath = 'polygon(0 0, 100% 0, 100% 92%, 96% 100%, 0 100%)';
        popup.style.maxWidth = '420px';
        popup.style.width = '92%';
        popup.style.padding = '0.8rem 1.2rem';
        popup.style.borderRadius = '0';
    }
};

// Función para mostrar toast de éxito
function showSuccessToast(message, title = 'ÉXITO') {
    return Swal.fire({
        ...SWEET_CONFIG,
        icon: 'success',
        title: title,
        html: `<span style="color: #a0b8d0; font-size: 14px;">${message}</span>`,
        timer: 3000,
    });
}

// Función para mostrar toast de error
function showErrorToast(message, title = 'ERROR') {
    return Swal.fire({
        ...SWEET_CONFIG,
        icon: 'error',
        title: title,
        html: `<span style="color: #ef4444; font-size: 14px;">${message}</span>`,
        timer: 5000,
        customClass: {
            ...SWEET_CONFIG.customClass,
            popup: 'tyr-popup tyr-error-popup'
        }
    });
}

// Función para mostrar toast de advertencia
function showWarningToast(message, title = 'ATENCIÓN') {
    return Swal.fire({
        ...SWEET_CONFIG,
        icon: 'warning',
        title: title,
        html: `<span style="color: #f59e0b; font-size: 14px;">${message}</span>`,
        timer: 4000,
    });
}

// Función para mostrar toast de info
function showInfoToast(message, title = 'INFORMACIÓN') {
    return Swal.fire({
        ...SWEET_CONFIG,
        icon: 'info',
        title: title,
        html: `<span style="color: #60a5fa; font-size: 14px;">${message}</span>`,
        timer: 3000,
    });
}

// Función para mostrar loading toast
function showLoadingToast(message = 'Procesando...') {
    return Swal.fire({
        ...SWEET_CONFIG,
        icon: 'info',
        title: 'CARGANDO',
        html: `<span style="color: #7cd5d5; font-size: 14px;">${message}</span>`,
        timer: 15000,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// Función para cerrar toast de loading
function closeLoadingToast() {
    Swal.close();
}

export async function loginController() {
    console.log('⚔️ Login controller inicializado');

    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const googleBtn = document.getElementById('googleBtn');
    const emailInput = document.getElementById('email');  
    const passwordInput = document.getElementById('passwordInput');

    // Inicializar efectos visuales
    initInputEffects();
    initTogglePassword();
    initButtonEffects();
    initRuneParallax();
    initSwordEffect();

    // ============ EVENT LISTENERS ============

    // Login con email/password
    if (form) {
        form.addEventListener('submit', handleLoginSubmit);
    }

    // Login con Google
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }

    // Enter key en campos
    if (emailInput) {
        emailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (passwordInput) passwordInput.focus();
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (form) form.dispatchEvent(new Event('submit'));
            }
        });
    }

    // ============ HANDLERS ============

    async function handleLoginSubmit(e) {
        e.preventDefault();

        const email = emailInput?.value?.trim() || '';
        const password = passwordInput?.value || '';

        // Validaciones básicas
        if (!email) {
            showErrorToast('Ingresa tu correo electrónico', 'CAMPO REQUERIDO');
            emailInput?.focus();
            return;
        }

        if (!validateEmail(email)) {
            showErrorToast('Correo electrónico inválido', 'FORMATO INCORRECTO');
            emailInput?.focus();
            return;
        }

        if (!password) {
            showErrorToast('Ingresa tu contraseña', 'CAMPO REQUERIDO');
            passwordInput?.focus();
            return;
        }

        if (password.length < 6) {
            showErrorToast('La contraseña debe tener al menos 6 caracteres', 'CONTRASEÑA CORTA');
            passwordInput?.focus();
            return;
        }

        // Mostrar loading
        const loadingToast = showLoadingToast('Verificando credenciales...');

        try {
            // ✅ INTENTAR LOGIN COMO USUARIO PRIMERO
            let result = null;
            let isAdmin = false;

            try {
                // Intentar login como usuario regular
                result = await AuthService.loginUser(email, password, false);
                console.log('✅ Login como usuario:', result);
            } catch (userError) {
                // Si falla como usuario, intentar como admin
                console.log('⚠️ No es usuario, intentando como admin...');
                try {
                    result = await AuthService.loginAdmin(email, password, false);
                    isAdmin = true;
                    console.log('✅ Login como admin:', result);
                } catch (adminError) {
                    // Si ambos fallan, lanzar el error del usuario
                    throw userError;
                }
            }

            // Cerrar loading
            closeLoadingToast();

            // ✅ VERIFICACIONES DE SEGURIDAD
            if (!result || !result.userData) {
                showErrorToast('No se encontró información del usuario', 'ERROR DE DATOS');
                return;
            }

            // ✅ Verificar que el usuario esté activo
            if (result.userData.isActive === false) {
                showErrorToast('Esta cuenta ha sido deshabilitada. Contacta al soporte.', 'CUENTA DESHABILITADA');
                return;
            }

            // ✅ Verificar que el email esté verificado (para usuarios regulares)
            if (!isAdmin && result.userData.emailVerified === false) {
                showErrorToast(
                    'Tu correo electrónico no ha sido verificado. Revisa tu bandeja de entrada (y spam) y haz clic en el enlace de verificación.',
                    'CORREO NO VERIFICADO'
                );
                return;
            }

            // ✅ Verificar email para admins
            if (isAdmin && result.userData.emailVerified === false) {
                showErrorToast(
                    'Tu correo de administrador no ha sido verificado. Revisa tu bandeja de entrada (y spam) y haz clic en el enlace de verificación.',
                    'CORREO NO VERIFICADO'
                );
                return;
            }

            // ✅ ÉXITO - Mostrar toast de bienvenida
            const user = AuthService.getCurrentUser();
            const userName = user?.displayName || user?.email || 'Guerrero';
            
            await showSuccessToast(
                `Bienvenido, <strong style="color: #7cd5d5;">${userName}</strong>`,
                'VICTORIA'
            );

            // ✅ REDIRIGIR A RUTAS LIMPIAS
            setTimeout(() => {
                const currentUser = AuthService.getCurrentUser();
                const isAdminUser = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
                
                // ✅ Usar navigateTo si existe
                if (typeof window.navigateTo === 'function') {
                    if (isAdminUser) {
                        window.navigateTo('/homeAdmin');
                    } else {
                        window.navigateTo('/homeUser');
                    }
                } else {
                    // Fallback
                    if (isAdminUser) {
                        window.location.href = '/homeAdmin';
                    } else {
                        window.location.href = '/homeUser';
                    }
                }
            }, 1200);

        } catch (error) {
            console.error('❌ Error en login:', error);
            
            // Cerrar loading si está abierto
            closeLoadingToast();
            
            let errorMsg = error.message || 'Error al iniciar sesión';
            let errorTitle = 'ERROR';
            
            // ✅ MENSAJES ESPECÍFICOS PARA CADA CASO
            if (error.message === 'email_not_verified') {
                errorMsg = 'Tu correo electrónico no ha sido verificado. Revisa tu bandeja de entrada (y spam) y haz clic en el enlace de verificación.';
                errorTitle = 'CORREO NO VERIFICADO';
            } else if (error.message === 'email_not_verified_admin') {
                errorMsg = 'Tu correo de administrador no ha sido verificado. Revisa tu bandeja de entrada (y spam) y haz clic en el enlace de verificación.';
                errorTitle = 'CORREO NO VERIFICADO';
            } else if (error.message === 'account_disabled') {
                errorMsg = 'Esta cuenta ha sido deshabilitada. Por favor, contacta al soporte para más información.';
                errorTitle = 'CUENTA DESHABILITADA';
            } else if (error.code === 'auth/user-not-found') {
                errorMsg = 'No existe una cuenta con este correo electrónico.';
                errorTitle = 'USUARIO NO ENCONTRADO';
            } else if (error.code === 'auth/wrong-password') {
                errorMsg = 'Contraseña incorrecta. Intenta nuevamente.';
                errorTitle = 'CONTRASEÑA INCORRECTA';
            } else if (error.code === 'auth/too-many-requests') {
                errorMsg = 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.';
                errorTitle = 'DEMASIADOS INTENTOS';
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = 'El formato del correo electrónico no es válido.';
                errorTitle = 'EMAIL INVÁLIDO';
            } else if (error.code === 'auth/user-disabled') {
                errorMsg = 'Esta cuenta ha sido desactivada. Contacta al soporte.';
                errorTitle = 'CUENTA DESACTIVADA';
            } else if (error.code === 'auth/network-request-failed') {
                errorMsg = 'Error de conexión a internet. Verifica tu red.';
                errorTitle = 'SIN CONEXIÓN';
            } else if (error.code === 'auth/internal-error') {
                errorMsg = 'Error interno del servidor. Intenta más tarde.';
                errorTitle = 'ERROR INTERNO';
            } else if (error.message?.includes('Invalid login credentials')) {
                errorMsg = 'Credenciales inválidas. Verifica tu email y contraseña.';
                errorTitle = 'CREDENCIALES INVÁLIDAS';
            }
            
            showErrorToast(errorMsg, errorTitle);
        }
    }

    async function handleGoogleLogin() {
        // Mostrar loading
        const loadingToast = showLoadingToast('Conectando con Google...');

        try {
            // ✅ INTENTAR LOGIN CON GOOGLE
            let result = null;
            let isAdmin = false;

            try {
                // Intentar login como usuario con Google
                result = await AuthService.loginUser(null, null, true);
                console.log('✅ Google login como usuario:', result);
            } catch (userError) {
                // Si falla como usuario, intentar como admin
                console.log('⚠️ No es usuario Google, intentando como admin...');
                try {
                    result = await AuthService.loginAdmin(null, null, true);
                    isAdmin = true;
                    console.log('✅ Google login como admin:', result);
                } catch (adminError) {
                    throw userError;
                }
            }

            // Cerrar loading
            closeLoadingToast();

            if (!result || !result.userData) {
                showErrorToast('No se encontró información del usuario', 'ERROR DE DATOS');
                return;
            }

            // ✅ Verificar que el usuario esté activo
            if (result.userData.isActive === false) {
                showErrorToast('Esta cuenta ha sido deshabilitada. Contacta al soporte.', 'CUENTA DESHABILITADA');
                return;
            }

            // ✅ Verificar que el email esté verificado
            if (!isAdmin && result.userData.emailVerified === false) {
                showErrorToast(
                    'Tu correo no está verificado. Revisa tu bandeja de entrada (y spam).',
                    'CORREO NO VERIFICADO'
                );
                return;
            }

            if (isAdmin && result.userData.emailVerified === false) {
                showErrorToast(
                    'Tu correo de administrador no está verificado. Revisa tu bandeja de entrada (y spam).',
                    'CORREO NO VERIFICADO'
                );
                return;
            }

            // ✅ ÉXITO - Mostrar toast de bienvenida
            const user = AuthService.getCurrentUser();
            const userName = user?.displayName || user?.email || 'Guerrero';
            
            await showSuccessToast(
                `Bienvenido, <strong style="color: #7cd5d5;">${userName}</strong>`,
                'VICTORIA'
            );

            // ✅ REDIRIGIR A RUTAS LIMPIAS
            setTimeout(() => {
                const currentUser = AuthService.getCurrentUser();
                const isAdminUser = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
                
                // ✅ Usar navigateTo si existe
                if (typeof window.navigateTo === 'function') {
                    if (isAdminUser) {
                        window.navigateTo('/homeAdmin');
                    } else {
                        window.navigateTo('/homeUser');
                    }
                } else {
                    // Fallback
                    if (isAdminUser) {
                        window.location.href = '/homeAdmin';
                    } else {
                        window.location.href = '/homeUser';
                    }
                }
            }, 1200);

        } catch (error) {
            console.error('❌ Error en Google login:', error);
            
            // Cerrar loading
            closeLoadingToast();
            
            let errorMsg = 'Error al iniciar sesión con Google';
            let errorTitle = 'ERROR DE GOOGLE';
            
            if (error.message === 'email_not_verified') {
                errorMsg = 'Tu correo no está verificado. Revisa tu bandeja de entrada (y spam).';
                errorTitle = 'CORREO NO VERIFICADO';
            } else if (error.message === 'email_not_verified_admin') {
                errorMsg = 'Tu correo de administrador no está verificado. Revisa tu bandeja de entrada (y spam).';
                errorTitle = 'CORREO NO VERIFICADO';
            } else if (error.message === 'account_disabled') {
                errorMsg = 'Esta cuenta ha sido deshabilitada. Contacta al soporte.';
                errorTitle = 'CUENTA DESHABILITADA';
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMsg = 'Ventana de Google cerrada. Intenta nuevamente.';
                errorTitle = 'VENTANA CERRADA';
            } else if (error.code === 'auth/popup-blocked') {
                errorMsg = 'El popup fue bloqueado por el navegador. Permite ventanas emergentes.';
                errorTitle = 'POPUP BLOQUEADO';
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMsg = 'Ya existe una cuenta con este correo usando otro método. Inicia sesión con email y contraseña.';
                errorTitle = 'CUENTA EXISTENTE';
            } else if (error.message?.includes('configuration-not-found')) {
                errorMsg = 'Error de configuración de Google. Contacta al soporte.';
                errorTitle = 'ERROR DE CONFIGURACIÓN';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMsg = 'La solicitud de Google fue cancelada. Intenta nuevamente.';
                errorTitle = 'SOLICITUD CANCELADA';
            } else if (error.code === 'auth/network-request-failed') {
                errorMsg = 'Error de conexión a internet. Verifica tu red.';
                errorTitle = 'SIN CONEXIÓN';
            }
            
            showErrorToast(errorMsg, errorTitle);
        }
    }

    // ============ FUNCIONES DE UTILIDAD ============

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // ============ FUNCIONES DE UI ============

    function setLoading(isLoading) {
        if (!submitBtn) return;

        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.classList.add('btn-loading');
            submitBtn.innerHTML = `
                <span class="btn-text">INGRESANDO...</span>
                <i class="fas fa-spinner fa-spin btn-icon"></i>
            `;
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
            submitBtn.innerHTML = `
                <span class="btn-text">INICIAR BATALLA</span>
                <i class="fas fa-swords btn-icon"></i>
            `;
        }
    }

    // ============ FUNCIONES VISUALES EXISTENTES ============

    function initInputEffects() {
        const inputs = document.querySelectorAll('.form-input');

        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                const parent = this.closest('.form-group');
                if (parent) {
                    parent.style.transform = 'scale(1.01)';
                    parent.style.transition = 'transform 0.2s ease';
                }
            });

            input.addEventListener('blur', function() {
                const parent = this.closest('.form-group');
                if (parent) {
                    parent.style.transform = 'scale(1)';
                }
            });

            input.addEventListener('input', function() {
                if (this.value.length > 0) {
                    this.style.borderColor = 'rgba(124, 213, 213, 0.6)';
                    this.style.boxShadow = '0 0 15px rgba(124, 213, 213, 0.15)';
                } else {
                    this.style.borderColor = 'rgba(124, 213, 213, 0.3)';
                    this.style.boxShadow = 'none';
                }
            });
        });
    }

    function initTogglePassword() {
        const toggleBtn = document.querySelector('.input-toggle');
        const passwordInput = document.getElementById('passwordInput');

        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', function() {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';

                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                }

                passwordInput.style.transition = 'all 0.3s ease';
                passwordInput.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    passwordInput.style.transform = 'scale(1)';
                }, 200);
            });
        }
    }

    function initButtonEffects() {
        if (submitBtn) {
            submitBtn.addEventListener('mouseenter', function() {
                this.style.boxShadow = '0 0 35px 5px rgba(124, 213, 213, 0.3)';
            });

            submitBtn.addEventListener('mouseleave', function() {
                this.style.boxShadow = '0 0 20px 2px rgba(124, 213, 213, 0.2)';
            });

            submitBtn.addEventListener('click', function(e) {
                if (this.disabled) return;

                // Ripple effect
                this.classList.add('btn-ripple');
                const rect = this.getBoundingClientRect();
                const ripple = document.createElement('span');
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.25);
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    pointer-events: none;
                    transform: scale(0);
                    animation: rippleAnim 0.6s ease-out forwards;
                `;

                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                    this.classList.remove('btn-ripple');
                }, 600);

                const icon = this.querySelector('.btn-icon');
                if (icon) {
                    icon.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    icon.style.transform = 'rotate(90deg) scale(1.3)';
                    setTimeout(() => {
                        icon.style.transform = 'rotate(0deg) scale(1)';
                    }, 400);
                }
            });
        }
    }

    function initRuneParallax() {
        const runeText = document.querySelector('.rune-text');

        if (runeText) {
            document.addEventListener('mousemove', function(e) {
                const x = (e.clientX / window.innerWidth - 0.5) * 20;
                const y = (e.clientY / window.innerHeight - 0.5) * 20;

                runeText.style.transition = 'transform 0.1s ease-out';
                runeText.style.transform = `translate(${x}px, ${y}px)`;
            });
        }
    }

    function initSwordEffect() {
        const sword = document.querySelector('.logo-sword');
        
        if (sword) {
            sword.addEventListener('click', function() {
                this.style.transition = 'all 0.3s ease';
                this.style.filter = 'drop-shadow(0 0 50px rgba(124, 213, 213, 0.9))';
                this.style.transform = 'scale(1.2) rotate(15deg)';
                
                setTimeout(() => {
                    this.style.filter = 'drop-shadow(0 0 15px rgba(124, 213, 213, 0.3))';
                    this.style.transform = 'scale(1) rotate(0deg)';
                }, 500);
            });
        }
    }

    // Efecto de bienvenida
    setTimeout(() => {
        const title = document.querySelector('.brand-title');
        if (title) {
            title.style.transition = 'text-shadow 0.5s ease';
            title.style.textShadow = '0 0 20px rgba(124, 213, 213, 0.3)';
            setTimeout(() => {
                title.style.textShadow = 'none';
            }, 1500);
        }
    }, 500);

    console.log('✨ Login con componentes cargado');
}

// ============ AGREGAR ESTILOS CSS PARA ANIMACIONES ============
const style = document.createElement('style');
style.textContent = `
    @keyframes shakeAnim {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    @keyframes fadeInDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes rippleAnim {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    .btn-loading {
        pointer-events: none;
        opacity: 0.8;
    }

    /* Estilos adicionales para SweetAlert Toast */
    .tyr-error-popup {
        border-left: 3px solid #ef4444 !important;
    }
    
    .tyr-error-popup .tyr-title {
        color: #ef4444 !important;
    }

    .tyr-close-btn {
        color: #7cd5d5 !important;
        opacity: 0.6 !important;
        transition: opacity 0.3s ease !important;
        font-size: 20px !important;
    }

    .tyr-close-btn:hover {
        opacity: 1 !important;
        color: #7cd5d5 !important;
    }

    .tyr-progress-bar {
        background: linear-gradient(90deg, #7cd5d5, #5ab8b8) !important;
        height: 3px !important;
    }

    /* Ajustes para el toast en móviles */
    @media (max-width: 480px) {
        .swal2-toast .tyr-popup {
            max-width: 95% !important;
            padding: 0.8rem 1rem !important;
        }
        
        .swal2-toast .tyr-title {
            font-size: 14px !important;
        }
        
        .swal2-toast .tyr-html {
            font-size: 12px !important;
        }
    }
`;
document.head.appendChild(style);