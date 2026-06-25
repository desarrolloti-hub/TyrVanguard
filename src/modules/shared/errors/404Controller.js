/* ========================================
   404 CONTROLLER - Página no encontrada
   ======================================== */

export async function notFoundController() {
    console.log('🗺️ 404 Controller inicializado');

    // Inicializar efectos
    initCompassEffect();
    initButtonEffects();

    console.log('✅ 404 Controller activado correctamente');
}

/**
 * Efecto de la brújula (parallax suave)
 */
function initCompassEffect() {
    const compass = document.querySelector('.logo-icon-404');
    const container = document.querySelector('.notfound-content');

    if (compass && container) {
        container.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            compass.style.transition = 'transform 0.1s ease-out';
            compass.style.transform = `
                perspective(800px)
                rotateX(${-y * 0.05}deg)
                rotateY(${x * 0.05}deg)
                scale(1.05)
            `;
        });

        container.addEventListener('mouseleave', function() {
            compass.style.transition = 'transform 0.5s ease';
            compass.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
        });
    }
}

/**
 * Efectos en los botones
 */
function initButtonEffects() {
    const buttons = document.querySelectorAll('.notfound-actions .btn');

    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.btn-icon');
            if (icon) {
                icon.style.transition = 'transform 0.3s ease';
                icon.style.transform = 'translateX(6px)';
            }
        });

        btn.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.btn-icon');
            if (icon) {
                icon.style.transition = 'transform 0.3s ease';
                icon.style.transform = 'translateX(0)';
            }
        });

        btn.addEventListener('click', function(e) {
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
    });
}

// Efecto de entrada con glow
setTimeout(() => {
    const title = document.querySelector('.notfound-title .text-secondary');
    if (title) {
        title.style.transition = 'text-shadow 0.8s ease';
        title.style.textShadow = '0 0 40px rgba(124, 213, 213, 0.4)';
        setTimeout(() => {
            title.style.textShadow = '0 0 20px rgba(124, 213, 213, 0.15)';
        }, 1500);
    }
}, 300);

console.log('🗺️ 404 con componentes cargado');