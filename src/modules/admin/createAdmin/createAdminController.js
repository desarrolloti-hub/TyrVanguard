/* ========================================
   REGISTER ADMIN CONTROLLER - Solo maneja eventos del formulario
   NO contiene lógica de negocio
   ======================================== */

import { AuthService } from '../../../services/authService.js';
import { AdminService } from '../../../services/adminService.js';

export async function createAdminController() {
    console.log('⚔️ Register Admin controller inicializado');

    const form = document.getElementById('registerAdminForm');
    const submitBtn = document.getElementById('submitAdminBtn');
    const googleBtn = document.getElementById('googleAdminBtn');
    const passwordInput = document.getElementById('adminPasswordInput');
    const confirmPassword = document.getElementById('adminConfirmPassword');
    const adminCodeInput = document.getElementById('adminCode');

    // Inicializar efectos visuales
    initInputEffects();
    initTogglePassword();
    initButtonEffects();
    initPasswordValidation();
    initAdminIconEffect();

    // ============ EVENT LISTENERS ============

    // Registro de admin con email y password
    if (form) {
        form.addEventListener('submit', handleAdminRegisterSubmit);
    }

    // Registro de admin con Google
    if (googleBtn) {
        googleBtn.addEventListener('click', handleAdminGoogleRegister);
    }

    // Enter key en campos
    const inputs = form?.querySelectorAll('input');
    inputs?.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                } else {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    });

    // ============ HANDLERS ============

    async function handleAdminRegisterSubmit(e) {
        e.preventDefault();

        // Obtener valores del formulario
        const firstName = document.getElementById('adminFirstName').value.trim();
        const lastName = document.getElementById('adminLastName').value.trim();
        const email = document.getElementById('adminEmail').value.trim();
        const password = passwordInput.value;
        const confirmPasswordValue = confirmPassword.value;
        const adminCode = adminCodeInput?.value?.trim() || '';
        const termsChecked = document.getElementById('adminTerms').checked;

        // Validaciones básicas frontend
        if (!firstName || firstName.length < 2) {
            showError('El nombre debe tener al menos 2 caracteres');
            document.getElementById('adminFirstName')?.focus();
            return;
        }

        if (!lastName || lastName.length < 2) {
            showError('El apellido debe tener al menos 2 caracteres');
            document.getElementById('adminLastName')?.focus();
            return;
        }

        if (!email || !validateEmail(email)) {
            showError('Correo electrónico inválido');
            document.getElementById('adminEmail')?.focus();
            return;
        }

        if (!password || password.length < 8) {
            showError('La contraseña debe tener al menos 8 caracteres');
            passwordInput?.focus();
            return;
        }

        if (password !== confirmPasswordValue) {
            showError('Las contraseñas no coinciden');
            confirmPassword?.focus();
            return;
        }

        if (!adminCode || adminCode.length < 4) {
            showError('Debes ingresar un código de administrador válido');
            adminCodeInput?.focus();
            return;
        }

        if (!termsChecked) {
            showError('Debes aceptar los términos y condiciones');
            return;
        }

        // Mostrar estado de carga
        setLoading(true);

        try {
            // ✅ Validar código de administrador usando AdminService
            const isValidCode = AdminService.validateAdminCode(adminCode);
            
            if (!isValidCode) {
                showError('Código de administrador inválido. Verifica e intenta nuevamente.');
                setLoading(false);
                adminCodeInput?.focus();
                return;
            }

            // Construir objeto de admin
            const adminData = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                photoURL: '',
                role: 'admin',
                isActive: true,
                provider: 'email'
            };

            // ✅ Llamar al servicio de administrador
            const result = await AdminService.register(adminData, password);

            console.log('✅ Administrador registrado exitosamente:', result);

            showSuccess('¡Administrador creado exitosamente! Verifica tu correo.');

            // Limpiar formulario
            form.reset();

            // Redirigir al panel de admin después de un momento
            setTimeout(() => {
                window.location.href = '/admin/dashboard';
            }, 2000);

        } catch (error) {
            console.error('❌ Error en registro de admin:', error);
            
            let errorMsg = error.message || 'Error al crear la cuenta de administrador';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMsg = 'Este correo ya está registrado como administrador.';
            } else if (error.code === 'auth/weak-password') {
                errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = 'El correo electrónico no es válido.';
            }
            
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    }

    async function handleAdminGoogleRegister() {
        setLoading(true);

        try {
            // ✅ Login con Google usando AuthService.loginAdmin()
            const result = await AuthService.loginAdmin(null, null, true);

            console.log('✅ Registro de admin con Google exitoso:', result);

            // ✅ Verificar si el usuario tiene permisos de admin
            const admin = AuthService.getAdminSession();
            
            if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
                showError('Esta cuenta no tiene permisos de administrador.');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
                return;
            }

            showSuccess('¡Bienvenido Administrador! Has iniciado sesión con Google.');

            setTimeout(() => {
                window.location.href = '/admin/dashboard';
            }, 1500);

        } catch (error) {
            console.error('❌ Error en registro de admin con Google:', error);
            
            let errorMsg = 'Error al iniciar sesión con Google';
            
            if (error.code === 'auth/popup-closed-by-user') {
                errorMsg = 'Ventana de Google cerrada. Intenta nuevamente.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMsg = 'El popup fue bloqueado. Permite ventanas emergentes.';
            } else if (error.message?.includes('configuration-not-found')) {
                errorMsg = 'Error de configuración. Contacta al soporte.';
            }
            
            showError(errorMsg);
        } finally {
            setLoading(false);
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
                <span class="btn-text">CREANDO ADMIN...</span>
                <i class="fas fa-spinner fa-spin btn-icon"></i>
            `;
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
            submitBtn.innerHTML = `
                <span class="btn-text">CREAR ADMINISTRADOR</span>
                <i class="fas fa-shield-halved btn-icon"></i>
            `;
        }
    }

    function showError(message) {
        // Limpiar mensajes anteriores
        const oldError = document.querySelector('.form-error-message');
        if (oldError) oldError.remove();

        const errorEl = document.createElement('div');
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

        errorEl.innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size: 18px;"></i>
            <span>${message}</span>
        `;

        const form = document.getElementById('registerAdminForm');
        if (form) {
            form.insertBefore(errorEl, form.firstChild);
        }

        // Ocultar mensaje de éxito si existe
        const successEl = document.querySelector('.form-success-message');
        if (successEl) successEl.remove();

        // Auto-ocultar después de 6 segundos
        clearTimeout(errorEl._timeout);
        errorEl._timeout = setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.style.opacity = '0';
                errorEl.style.transition = 'opacity 0.3s ease';
                setTimeout(() => errorEl.remove(), 300);
            }
        }, 6000);
    }

    function showSuccess(message) {
        // Limpiar mensajes anteriores
        const oldSuccess = document.querySelector('.form-success-message');
        if (oldSuccess) oldSuccess.remove();

        const successEl = document.createElement('div');
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
            animation: fadeInDown 0.3s ease;
        `;

        successEl.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 18px;"></i>
            <span>${message}</span>
        `;

        const form = document.getElementById('registerAdminForm');
        if (form) {
            form.insertBefore(successEl, form.firstChild);
        }

        // Ocultar mensaje de error si existe
        const errorEl = document.querySelector('.form-error-message');
        if (errorEl) errorEl.remove();
    }

    // ============ FUNCIONES VISUALES ============

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
                ? document.getElementById('adminPasswordInput')
                : document.getElementById('adminConfirmPassword');

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
            });
        }
    }

    function initPasswordValidation() {
        const password = document.getElementById('adminPasswordInput');
        const confirmPassword = document.getElementById('adminConfirmPassword');

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

    function initAdminIconEffect() {
        const icon = document.querySelector('.logo-icon-admin');
        
        if (icon) {
            icon.addEventListener('click', function() {
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

    console.log('✨ Register Admin con componentes cargado');
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
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }

    .btn-loading {
        pointer-events: none;
        opacity: 0.8;
    }
`;
document.head.appendChild(style);