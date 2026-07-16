/* ========================================
   verifyEmailController.js
   Controlador para verificación de correo electrónico
   ======================================== */

import { auth } from '../../../../../config/firebaseConfig.js';

export function verifyEmailController() {
    console.log('✉️ Inicializando Verificación de Correo...');

    // --- 1. DOM References ---
    const verifyContent = document.getElementById('verifyContent');

    // --- 2. Obtener código de verificación de la URL ---
    function getOobCode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('oobCode');
    }

    // --- 3. Mostrar estados ---
    function showLoading() {
        if (verifyContent) {
            verifyContent.innerHTML = `
                <div class="loading-state" id="loadingState">
                    <div class="spinner"></div>
                    <p class="loading-text">Verificando tu correo electrónico...</p>
                </div>
            `;
        }
    }

    function showSuccess() {
        if (verifyContent) {
            verifyContent.innerHTML = `
                <div class="success-state" style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-check-circle" style="font-size: 64px; color: #34d399; margin-bottom: 16px;"></i>
                    <h2 style="color: var(--text-primary); margin-bottom: 8px;">¡CORREO VERIFICADO!</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 8px;">Tu correo electrónico ha sido verificado exitosamente.</p>
                    <p style="color: var(--text-muted); font-size: var(--font-size-sm); margin-bottom: 20px;">
                        <i class="fas fa-shield-alt"></i> Ahora eres un guerrero verificado
                    </p>
                    <button id="goToLoginBtn" class="btn btn-primary" style="background: var(--color-primary); color: #003737; border: none; padding: 12px 32px; border-radius: var(--border-radius-md); font-weight: 600; cursor: pointer;">
                        <i class="fas fa-sword"></i> INICIAR SESIÓN
                    </button>
                </div>
            `;

            const loginBtn = document.getElementById('goToLoginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('/iniciarSesion');
                    } else {
                        window.location.href = '/iniciarSesion';
                    }
                });
            }
        }
    }

    function showError(message) {
        if (verifyContent) {
            verifyContent.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-exclamation-circle" style="font-size: 64px; color: #ff6b6b; margin-bottom: 16px;"></i>
                    <h2 style="color: var(--text-primary); margin-bottom: 8px;">ERROR DE VERIFICACIÓN</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 8px;">${message || 'No se pudo verificar el correo'}</p>
                    <p style="color: var(--text-muted); font-size: var(--font-size-sm); margin-bottom: 20px;">
                        <i class="fas fa-clock"></i> El enlace puede haber expirado o ya fue usado
                    </p>
                    <button id="goToLoginBtn" class="btn btn-primary" style="background: var(--color-primary); color: #003737; border: none; padding: 12px 32px; border-radius: var(--border-radius-md); font-weight: 600; cursor: pointer;">
                        <i class="fas fa-arrow-left"></i> VOLVER AL LOGIN
                    </button>
                </div>
            `;

            const loginBtn = document.getElementById('goToLoginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('/iniciarSesion');
                    } else {
                        window.location.href = '/iniciarSesion';
                    }
                });
            }
        }
    }

    function showInvalidLink() {
        if (verifyContent) {
            verifyContent.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #ffb347; margin-bottom: 16px;"></i>
                    <h2 style="color: var(--text-primary); margin-bottom: 8px;">ENLACE INVÁLIDO</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 8px;">No se encontró un código de verificación válido.</p>
                    <p style="color: var(--text-muted); font-size: var(--font-size-sm); margin-bottom: 20px;">
                        <i class="fas fa-info-circle"></i> Asegúrate de usar el enlace del correo completo
                    </p>
                    <button id="goToLoginBtn" class="btn btn-primary" style="background: var(--color-primary); color: #003737; border: none; padding: 12px 32px; border-radius: var(--border-radius-md); font-weight: 600; cursor: pointer;">
                        <i class="fas fa-arrow-left"></i> VOLVER AL LOGIN
                    </button>
                </div>
            `;

            const loginBtn = document.getElementById('goToLoginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('/iniciarSesion');
                    } else {
                        window.location.href = '/iniciarSesion';
                    }
                });
            }
        }
    }

    // --- 4. Verificar correo ---
    async function verifyEmail() {
        showLoading();

        const oobCode = getOobCode();

        if (!oobCode) {
            console.warn('⚠️ No se encontró código de verificación en la URL');
            showInvalidLink();
            return;
        }

        try {
            console.log('🔑 Verificando con código:', oobCode);
            
            // Verificar el correo usando Firebase Auth
            await auth.applyActionCode(oobCode);
            
            console.log('✅ Correo verificado exitosamente');
            showSuccess();

            // Disparar evento para notificar que se verificó el correo
            document.dispatchEvent(new CustomEvent('email:verified', {
                detail: { success: true }
            }));

        } catch (error) {
            console.error('❌ Error al verificar correo:', error);
            
            // Manejar errores específicos de Firebase
            let errorMessage = 'No se pudo verificar el correo.';
            
            if (error.code === 'auth/expired-action-code') {
                errorMessage = 'El enlace de verificación ha expirado. Solicita uno nuevo.';
            } else if (error.code === 'auth/invalid-action-code') {
                errorMessage = 'El enlace de verificación no es válido.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'La cuenta ha sido deshabilitada. Contacta a soporte.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'No se encontró la cuenta asociada a este enlace.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showError(errorMessage);
        }
    }

    // --- 5. Inicializar ---
    verifyEmail();
    console.log('✅ Verificación de Correo inicializada correctamente');
}