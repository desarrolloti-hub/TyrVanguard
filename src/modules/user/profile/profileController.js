/* ========================================
   profileController.js
   Controlador para edición de perfil
   ======================================== */

import { UserService } from '../../../services/userService.js';
import { User } from '../../../classes/userModel.js';


export async function profileController() {
    console.log('🛡️ Inicializando Perfil del Guerrero...');

    // --- 1. Obtener usuario actual desde session/localStorage ---
    let currentUser = null;
    let userId = null;

    try {
        const session = UserService.getSession();
        if (session && session.id) {
            userId = session.id;
            console.log('🔍 Usuario ID encontrado:', userId);
            
            currentUser = await UserService.getUserById(userId);
            if (currentUser) {
                console.log('✅ Usuario cargado:', currentUser.fullName);
            } else {
                throw new Error('Usuario no encontrado en la base de datos');
            }
        } else {
            throw new Error('No hay sesión activa');
        }
    } catch (error) {
        console.error('❌ Error al cargar usuario:', error);
        window.location.href = '/login.html';
        return;
    }

    // --- 2. DOM References ---
    const form = document.getElementById('profileForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const planInput = document.getElementById('plan');
    const roleInput = document.getElementById('role');
    const avatarImg = document.getElementById('profileAvatar');
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const avatarInput = document.getElementById('avatarInput');
    const statusDot = document.getElementById('statusDot');
    const statusLabel = document.getElementById('statusLabel');
    const createdAt = document.getElementById('createdAt');
    const lastLogin = document.getElementById('lastLogin');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    const firstNameError = document.getElementById('firstNameError');
    const lastNameError = document.getElementById('lastNameError');

    // --- 3. Variables para trackear cambios ---
    let newAvatarBase64 = null; // Guardará la imagen en base64 si se cambia

    // --- 4. Cargar datos del usuario ---
    function loadUserData() {
        if (!currentUser) return;

        if (firstNameInput) firstNameInput.value = currentUser.firstName || '';
        if (lastNameInput) lastNameInput.value = currentUser.lastName || '';
        if (emailInput) emailInput.value = currentUser.email || '';

        const planLabels = {
            free: '🆓 Gratuito',
            basic: '⚔️ Básico',
            premium: '👑 Premium',
            enterprise: '🏰 Empresarial'
        };
        const roleLabels = {
            user: '🛡️ Guerrero',
            admin: '⚜️ Administrador',
            super_admin: '👑 Super Admin',
            guest: '👤 Invitado'
        };

        if (planInput) planInput.value = planLabels[currentUser.plan] || currentUser.plan || '🆓 Gratuito';
        if (roleInput) roleInput.value = roleLabels[currentUser.role] || currentUser.role || '🛡️ Guerrero';

        // Avatar - mostrar imagen guardada o generar con iniciales
        if (avatarImg) {
            if (currentUser.photoURL && currentUser.photoURL.startsWith('data:image/')) {
                // Si es base64, mostrarlo directamente
                avatarImg.src = currentUser.photoURL;
            } else if (currentUser.photoURL) {
                // Si es una URL normal
                avatarImg.src = currentUser.photoURL;
            } else {
                // Generar avatar con iniciales
                const name = currentUser.fullName || 'Usuario';
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7cd5d5&color=003737&size=128&font-size=0.5&bold=true`;
            }
        }

        if (statusDot) {
            statusDot.className = `status-dot ${currentUser.isActive !== false ? 'active' : 'inactive'}`;
        }
        if (statusLabel) {
            statusLabel.textContent = currentUser.isActive !== false ? 'Activo' : 'Inactivo';
        }

        if (createdAt && currentUser.createdAt) {
            const date = new Date(currentUser.createdAt);
            createdAt.textContent = date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        if (lastLogin && currentUser.lastLogin) {
            const date = new Date(currentUser.lastLogin);
            lastLogin.textContent = date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (lastLogin) {
            lastLogin.textContent = 'Nunca';
        }
    }

    // --- 5. Validación ---
    function validateForm() {
        let isValid = true;

        const firstName = firstNameInput.value.trim();
        if (!firstName || firstName.length < 2) {
            firstNameInput.classList.add('error');
            firstNameError.style.display = 'flex';
            isValid = false;
        } else {
            firstNameInput.classList.remove('error');
            firstNameError.style.display = 'none';
        }

        const lastName = lastNameInput.value.trim();
        if (!lastName || lastName.length < 2) {
            lastNameInput.classList.add('error');
            lastNameError.style.display = 'flex';
            isValid = false;
        } else {
            lastNameInput.classList.remove('error');
            lastNameError.style.display = 'none';
        }

        return isValid;
    }

    // --- 6. Convertir imagen a base64 ---
    function imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

    // --- 7. Guardar cambios usando UserService ---
    async function saveProfile() {
        if (!validateForm()) {
            Swal.fire({
                title: '⚔️ Campos inválidos',
                text: 'Revisa los campos resaltados y corrígelos.',
                icon: 'error',
                customClass: {
                    popup: 'tyr-popup tyr-error-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm'
                }
            });
            return;
        }

        try {
            Swal.fire({
                title: '⚔️ Actualizando...',
                text: 'Forjando tu nueva identidad',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                customClass: {
                    popup: 'tyr-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html'
                }
            });

            // Preparar datos para actualizar
            const updateData = {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim()
            };

            // Si hay una nueva imagen en base64, agregarla a los datos
            if (newAvatarBase64) {
                updateData.photoURL = newAvatarBase64;
                console.log('🖼️ Guardando avatar en base64 (tamaño:', Math.round(newAvatarBase64.length / 1024), 'KB)');
            }

            // Usar UserService.updateProfile con el userId real
            const updatedUser = await UserService.updateProfile(userId, updateData);
            
            if (updatedUser) {
                currentUser = new User(updatedUser);
                
                // Actualizar localStorage
                const session = UserService.getSession();
                if (session) {
                    session.firstName = currentUser.firstName;
                    session.lastName = currentUser.lastName;
                    session.fullName = currentUser.fullName;
                    session.initials = currentUser.initials;
                    session.photoURL = currentUser.photoURL;
                    localStorage.setItem('user-TYRVANGUARD', JSON.stringify(session));
                }
                
                // Resetear el flag de nueva imagen
                newAvatarBase64 = null;
                
                Swal.fire({
                    title: '✅ Perfil actualizado',
                    text: 'Tus datos han sido guardados exitosamente.',
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true,
                    customClass: {
                        popup: 'tyr-popup',
                        title: 'tyr-title',
                        htmlContainer: 'tyr-html',
                        confirmButton: 'tyr-btn-confirm'
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error al guardar:', error);
            Swal.fire({
                title: '❌ Error al guardar',
                text: error.message || 'Ocurrió un error al actualizar el perfil',
                icon: 'error',
                customClass: {
                    popup: 'tyr-popup tyr-error-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm'
                }
            });
        }
    }

    // --- 8. Cambiar contraseña ---
    function changePassword() {
        Swal.fire({
            title: '🔑 Cambiar Contraseña',
            html: `
                <div class="form" style="text-align: left;">
                    <div class="form-group">
                        <label class="form-label">Contraseña Actual</label>
                        <div class="input-icon-wrapper">
                            <i class="fas fa-lock input-icon"></i>
                            <input type="password" class="form-input" id="currentPassword" placeholder="••••••••" />
                            <button type="button" class="input-toggle" id="toggleCurrentPw">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nueva Contraseña</label>
                        <div class="input-icon-wrapper">
                            <i class="fas fa-key input-icon"></i>
                            <input type="password" class="form-input" id="newPassword" placeholder="••••••••" />
                            <button type="button" class="input-toggle" id="toggleNewPw">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirmar Contraseña</label>
                        <div class="input-icon-wrapper">
                            <i class="fas fa-check-double input-icon"></i>
                            <input type="password" class="form-input" id="confirmPassword" placeholder="••••••••" />
                            <button type="button" class="input-toggle" id="toggleConfirmPw">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `,
            confirmButtonText: '🔑 CAMBIAR',
            cancelButtonText: 'CANCELAR',
            showCancelButton: true,
            customClass: {
                popup: 'tyr-popup',
                title: 'tyr-title',
                htmlContainer: 'tyr-html',
                confirmButton: 'tyr-btn-confirm',
                cancelButton: 'tyr-btn-cancel',
                actions: 'tyr-actions',
                closeButton: 'tyr-close-btn'
            },
            preConfirm: () => {
                const currentPw = document.getElementById('currentPassword')?.value;
                const newPw = document.getElementById('newPassword')?.value;
                const confirmPw = document.getElementById('confirmPassword')?.value;

                if (!currentPw) {
                    Swal.showValidationMessage('Ingresa tu contraseña actual');
                    return false;
                }
                if (!newPw || newPw.length < 6) {
                    Swal.showValidationMessage('La nueva contraseña debe tener al menos 6 caracteres');
                    return false;
                }
                if (newPw !== confirmPw) {
                    Swal.showValidationMessage('Las contraseñas no coinciden');
                    return false;
                }

                return { currentPw, newPw };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    console.log('🔑 Contraseña actualizada para usuario:', userId);
                    Swal.fire({
                        title: '✅ Contraseña actualizada',
                        text: 'Tu contraseña ha sido cambiada exitosamente.',
                        icon: 'success',
                        timer: 3000,
                        timerProgressBar: true,
                        customClass: {
                            popup: 'tyr-popup',
                            title: 'tyr-title',
                            htmlContainer: 'tyr-html',
                            confirmButton: 'tyr-btn-confirm'
                        }
                    });
                } catch (error) {
                    Swal.fire({
                        title: '❌ Error al cambiar contraseña',
                        text: error.message || 'Ocurrió un error',
                        icon: 'error',
                        customClass: {
                            popup: 'tyr-popup tyr-error-popup',
                            title: 'tyr-title',
                            htmlContainer: 'tyr-html',
                            confirmButton: 'tyr-btn-confirm'
                        }
                    });
                }
            }
        });

        setTimeout(() => {
            document.querySelectorAll('.input-toggle').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const input = btn.closest('.input-icon-wrapper').querySelector('input');
                    if (input) {
                        const icon = btn.querySelector('i');
                        if (input.type === 'password') {
                            input.type = 'text';
                            icon.className = 'fas fa-eye-slash';
                        } else {
                            input.type = 'password';
                            icon.className = 'fas fa-eye';
                        }
                    }
                });
            });
        }, 100);
    }

    // --- 9. Subir avatar y convertir a base64 ---
    async function uploadAvatar(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Swal.fire({
                title: '⚠️ Formato inválido',
                text: 'Solo se permiten imágenes.',
                icon: 'error',
                timer: 2000,
                timerProgressBar: true,
                customClass: {
                    popup: 'tyr-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm'
                }
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({
                title: '⚠️ Imagen muy grande',
                text: 'El tamaño máximo es 5MB.',
                icon: 'error',
                timer: 2000,
                timerProgressBar: true,
                customClass: {
                    popup: 'tyr-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm'
                }
            });
            return;
        }

        try {
            // Mostrar loading en el botón
            Swal.fire({
                title: '🔄 Procesando imagen...',
                text: 'Convirtiendo a base64',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                customClass: {
                    popup: 'tyr-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html'
                }
            });

            // Convertir a base64
            const base64Image = await imageToBase64(file);
            
            // Guardar en la variable para guardar al hacer submit
            newAvatarBase64 = base64Image;
            
            // Mostrar preview
            if (avatarImg) {
                avatarImg.src = base64Image;
            }

            Swal.fire({
                title: '✅ Avatar listo',
                text: 'La imagen se guardará al actualizar el perfil.',
                icon: 'success',
                timer: 2000,
                timerProgressBar: true,
                customClass: {
                    popup: 'tyr-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm'
                }
            });
            
            console.log('🖼️ Avatar convertido a base64 (tamaño:', Math.round(base64Image.length / 1024), 'KB)');
            
        } catch (error) {
            console.error('❌ Error al convertir imagen:', error);
            Swal.fire({
                title: '❌ Error al procesar imagen',
                text: error.message || 'Ocurrió un error',
                icon: 'error',
                customClass: {
                    popup: 'tyr-popup tyr-error-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm'
                }
            });
        }
    }

    // --- 10. Event Listeners ---

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfile();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = '/home.html';
        });
    }
    if (cancelProfileBtn) {
        cancelProfileBtn.addEventListener('click', () => {
            window.location.href = '/home.html';
        });
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
    }

    if (avatarUploadBtn) {
        avatarUploadBtn.addEventListener('click', () => {
            if (avatarInput) avatarInput.click();
        });
    }
    if (avatarInput) {
        avatarInput.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files[0]) {
                await uploadAvatar(e.target.files[0]);
            }
            e.target.value = '';
        });
    }

    // --- 11. Inicializar ---
    loadUserData();
    console.log('✅ Perfil del Guerrero inicializado correctamente');
}