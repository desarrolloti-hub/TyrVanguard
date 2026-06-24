/* ========================================
   LOGIN CONTROLLER - Usando componentes
   ======================================== */

export async function loginController() {
    console.log('⚔️ Login controller inicializado');

    // 🛡️ PREVENIR SCROLL
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';

    initInputEffects();
    initTogglePassword();
    initButtonEffects();
    initFormInteraction();
    initRuneParallax();
    initSwordEffect();

    console.log('✅ Login controller activado correctamente');
}

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
    const submitBtn = document.getElementById('submitBtn');

    if (submitBtn) {
        submitBtn.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 35px 5px rgba(124, 213, 213, 0.3)';
        });

        submitBtn.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 0 20px 2px rgba(124, 213, 213, 0.2)';
        });

        submitBtn.addEventListener('click', function(e) {
            // Ripple effect usando la clase btn-ripple
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

function initFormInteraction() {
    const form = document.getElementById('loginForm');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                // Estado de carga
                submitBtn.classList.add('btn-loading');
                
                const scanline = document.querySelector('.form-scanline');
                if (scanline) {
                    scanline.style.transition = 'transform 3s ease-in-out';
                    scanline.style.transform = 'translateY(200%)';
                    setTimeout(() => {
                        scanline.style.transform = 'translateY(-100%)';
                    }, 3000);
                }

                const inputs = document.querySelectorAll('.form-input');
                inputs.forEach((input, index) => {
                    input.style.transition = 'all 0.3s ease';
                    input.style.transform = 'scale(0.98)';
                    input.style.opacity = '0.7';
                    setTimeout(() => {
                        input.style.transform = 'scale(1)';
                        input.style.opacity = '1';
                    }, 200 * (index + 1));
                });

                setTimeout(() => {
                    submitBtn.classList.remove('btn-loading');
                }, 1200);
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