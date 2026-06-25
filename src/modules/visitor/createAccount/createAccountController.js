/* ========================================
   REGISTER CONTROLLER - Solo maneja eventos del formulario
   NO contiene lógica de negocio
   ======================================== */

import { AuthService } from '../../../services/authService.js';
import { UserService } from '../../../services/userService.js';

export async function createAccountController() {
    console.log('⚔️ Register controller inicializado');

    const form = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    const googleBtn = document.getElementById('googleBtn');
    const passwordInput = document.getElementById('passwordInput');
    const confirmPassword = document.getElementById('confirmPassword');

    // Inicializar efectos visuales
    initInputEffects();
    initTogglePassword();
    initButtonEffects();
    initFormInteraction();
    initRuneParallax();
    initSwordEffect();
    initPasswordValidation();

    // ============ EVENT LISTENERS ============

    // Registro con email y password
    if (form) {
        form.addEventListener('submit', handleRegisterSubmit);
    }

    // Registro con Google
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleRegister);
    }

    // ============ HANDLERS ============

    async function handleRegisterSubmit(e) {
        e.preventDefault();

        // Obtener valores del formulario
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const confirmPasswordValue = confirmPassword.value;
        const termsChecked = document.getElementById('terms').checked;

        // Validaciones básicas del frontend (UX, no seguridad)
        if (!termsChecked) {
            showError('Debes aceptar los términos y condiciones');
            return;
        }

        if (password !== confirmPasswordValue) {
            showError('Las contraseñas no coinciden');
            return;
        }

        // Mostrar estado de carga
        setLoading(true);

        try {
            // Construir objeto de usuario
            const userData = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                photoURL: '',
                role: 'user',
                plan: 'free'
            };

            // Llamar al servicio de autenticación
            const result = await AuthService.register(userData, password);

            console.log('✅ Usuario registrado exitosamente:', result);

            // Mostrar mensaje de éxito
            showSuccess('¡Cuenta creada exitosamente! Verifica tu correo.');

            // Redirigir después de un momento
            setTimeout(() => {
                window.location.href = '/iniciarSesion';
            }, 2000);

        } catch (error) {
            console.error('❌ Error en registro:', error);
            showError(error.message || 'Error al crear la cuenta. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleRegister() {
        // Mostrar estado de carga
        setLoading(true);

        try {
            // Login con Google (el servicio crea la cuenta si no existe)
            const result = await AuthService.login(null, null, true);

            console.log('✅ Registro con Google exitoso:', result);

            showSuccess('¡Bienvenido! Has iniciado sesión con Google.');

            // Redirigir según el rol del usuario
            setTimeout(() => {
                const user = AuthService.getCurrentUser();
                if (user?.role === 'admin' || user?.role === 'super_admin') {
                    window.location.href = '/admin/dashboard';
                } else {
                    window.location.href = '/dashboard';
                }
            }, 1500);

        } catch (error) {
            console.error('❌ Error en registro con Google:', error);
            
            if (error.code === 'auth/popup-closed-by-user') {
                showError('Ventana de Google cerrada. Intenta nuevamente.');
            } else {
                showError(error.message || 'Error al iniciar sesión con Google');
            }
        } finally {
            setLoading(false);
        }
    }

    // ============ FUNCIONES DE UI ============

    function setLoading(isLoading) {
        if (!submitBtn) return;

        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.classList.add('btn-loading');
            submitBtn.innerHTML = `
                <span class="btn-text">CREANDO CUENTA...</span>
                <i class="fas fa-spinner fa-spin btn-icon"></i>
            `;
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
            submitBtn.innerHTML = `
                <span class="btn-text">CREAR CUENTA</span>
                <i class="fas fa-arrow-right btn-icon"></i>
            `;
        }
    }

    function showError(message) {
        // Buscar o crear elemento de error
        let errorEl = document.querySelector('.form-error-message');
        
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'form-error-message';
            errorEl.style.cssText = `
                color: #ef4444;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 8px;
                padding: 12px 16px;
                margin: 12px 0;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: shakeAnim 0.4s ease;
            `;
            
            const form = document.getElementById('registerForm');
            if (form) {
                form.insertBefore(errorEl, form.firstChild);
            }
        }

        errorEl.innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size: 18px;"></i>
            <span>${message}</span>
        `;
        errorEl.style.display = 'flex';

        // Ocultar después de 5 segundos
        clearTimeout(errorEl._timeout);
        errorEl._timeout = setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        let successEl = document.querySelector('.form-success-message');
        
        if (!successEl) {
            successEl = document.createElement('div');
            successEl.className = 'form-success-message';
            successEl.style.cssText = `
                color: #22c55e;
                background: rgba(34, 197, 94, 0.1);
                border: 1px solid rgba(34, 197, 94, 0.3);
                border-radius: 8px;
                padding: 12px 16px;
                margin: 12px 0;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            const form = document.getElementById('registerForm');
            if (form) {
                form.insertBefore(successEl, form.firstChild);
            }
        }

        successEl.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 18px;"></i>
            <span>${message}</span>
        `;
        successEl.style.display = 'flex';

        // Ocultar mensajes de error si existen
        const errorEl = document.querySelector('.form-error-message');
        if (errorEl) {
            errorEl.style.display = 'none';
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
        const toggleBtns = document.querySelectorAll('.input-toggle');
        
        toggleBtns.forEach((btn, index) => {
            const input = index === 0 
                ? document.getElementById('passwordInput')
                : document.getElementById('confirmPassword');

            if (btn && input) {
                btn.addEventListener('click', function() {
                    const isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';

                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                    }

                    input.style.transition = 'all 0.3s ease';
                    input.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        input.style.transform = 'scale(1)';
                    }, 200);
                });
            }
        });
    }

    function initButtonEffects() {
        if (submitBtn) {
            submitBtn.addEventListener('mouseenter', function() {
                this.style.boxShadow = '0 0 35px 5px rgba(124, 213, 213, 0.3)';
            });

            submitBtn.addEventListener('mouseleave', function() {
                this.style.boxShadow = '0 0 20px 2px rgba(124, 213, 213, 0.2)';
            });
        }
    }

    function initFormInteraction() {
        // Ya está manejado por el submit event
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

    function initPasswordValidation() {
        const password = document.getElementById('passwordInput');
        const confirmPassword = document.getElementById('confirmPassword');

        if (password && confirmPassword) {
            confirmPassword.addEventListener('input', function() {
                if (this.value.length > 0 && this.value !== password.value) {
                    this.style.borderColor = '#ef4444';
                    this.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.15)';
                } else if (this.value.length > 0 && this.value === password.value) {
                    this.style.borderColor = '#22c55e';
                    this.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.15)';
                } else {
                    this.style.borderColor = 'rgba(124, 213, 213, 0.3)';
                    this.style.boxShadow = 'none';
                }
            });

            password.addEventListener('input', function() {
                if (confirmPassword.value.length > 0 && confirmPassword.value !== this.value) {
                    confirmPassword.style.borderColor = '#ef4444';
                    confirmPassword.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.15)';
                } else if (confirmPassword.value.length > 0 && confirmPassword.value === this.value) {
                    confirmPassword.style.borderColor = '#22c55e';
                    confirmPassword.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.15)';
                }
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

    console.log('✨ Register con componentes cargado');
}

// Agregar animación shake para errores
const style = document.createElement('style');
style.textContent = `
    @keyframes shakeAnim {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);