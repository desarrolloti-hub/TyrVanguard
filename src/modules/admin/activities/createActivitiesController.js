/* ========================================
   CREATE ACTIVITY CONTROLLER - Admin
   Creación de actividades distractoras
   ======================================== */

import { ActivityService } from '../../../services/activityService.js';

export function createActivityController() {
    console.log('🏋️ Create Activity Controller inicializado');

    // --- 1. DOM References ---
    const form = document.getElementById('createActivityForm');
    const titleInput = document.getElementById('activityTitle');
    const descriptionInput = document.getElementById('activityDescription');
    const categoryInput = document.getElementById('activityCategory');
    const difficultyInput = document.getElementById('activityDifficulty');
    const durationInput = document.getElementById('activityDuration');
    const benefitsInput = document.getElementById('activityBenefits');
    const stepsTextarea = document.getElementById('activitySteps');
    const resourcesInput = document.getElementById('activityResources');
    const tagsInput = document.getElementById('activityTags');
    const imageInput = document.getElementById('activityImage');
    const statusInput = document.getElementById('activityStatus');
    const submitBtn = document.getElementById('submitActivityBtn');

    // --- 2. Funciones auxiliares ---
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function getFormData() {
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const category = categoryInput.value;
        const difficulty = difficultyInput.value;
        const duration = parseInt(durationInput.value);
        const benefits = benefitsInput.value.trim();
        const steps = stepsTextarea.value.trim();
        const resources = resourcesInput.value.trim();
        const tags = tagsInput.value.trim();
        const imageURL = imageInput.value.trim();
        const status = statusInput.value;

        // Procesar arrays
        const benefitsArray = benefits ? benefits.split(',').map(b => b.trim()).filter(Boolean) : [];
        const resourcesArray = resources ? resources.split(',').map(r => r.trim()).filter(Boolean) : [];
        const tagsArray = tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

        // Procesar pasos (separar por saltos de línea)
        const stepsArray = steps.split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        return {
            title,
            description,
            category,
            difficulty,
            duration,
            benefits: benefitsArray,
            steps: stepsArray,
            resources: resourcesArray,
            tags: tagsArray,
            imageURL,
            isActive: status === 'active'
        };
    }

    // --- 3. Validación ---
    function validateForm(formData) {
        const errors = [];

        if (!formData.title || formData.title.length < 3) {
            errors.push('El título debe tener al menos 3 caracteres');
            titleInput.classList.add('error');
        } else {
            titleInput.classList.remove('error');
        }

        if (!formData.description || formData.description.length < 10) {
            errors.push('La descripción debe tener al menos 10 caracteres');
            descriptionInput.classList.add('error');
        } else {
            descriptionInput.classList.remove('error');
        }

        if (!formData.category) {
            errors.push('Selecciona una categoría');
            categoryInput.classList.add('error');
        } else {
            categoryInput.classList.remove('error');
        }

        if (!formData.difficulty) {
            errors.push('Selecciona una dificultad');
            difficultyInput.classList.add('error');
        } else {
            difficultyInput.classList.remove('error');
        }

        if (!formData.duration) {
            errors.push('Selecciona una duración estimada');
            durationInput.classList.add('error');
        } else {
            durationInput.classList.remove('error');
        }

        if (formData.steps.length === 0) {
            errors.push('Agrega al menos un paso/instrucción');
            stepsTextarea.classList.add('error');
        } else {
            stepsTextarea.classList.remove('error');
        }

        if (formData.imageURL && !isValidURL(formData.imageURL)) {
            errors.push('La URL de la imagen no es válida');
            imageInput.classList.add('error');
        } else {
            imageInput.classList.remove('error');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // --- 4. Guardar actividad usando el servicio ---
    async function saveActivity(event) {
        event.preventDefault();

        // Obtener datos del formulario
        const formData = getFormData();

        // Validar
        const validation = validateForm(formData);
        if (!validation.valid) {
            Swal.fire({
                title: 'Campos inválidos',
                text: validation.errors.join('. '),
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
            // Deshabilitar botón
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GUARDANDO...';

            // ✅ Obtener admin ID desde la sesión (usando UserService)
            const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
            const adminId = session?.id || 'admin';

            console.log('📦 Datos a enviar al servicio:', formData);

            // Crear actividad usando el servicio
            const newActivity = await ActivityService.createActivity(adminId, formData);

            console.log('✅ Actividad creada:', newActivity);

            // Disparar evento
            document.dispatchEvent(new CustomEvent('activity:created', {
                detail: newActivity
            }));

            // Mostrar éxito con SweetAlert
            Swal.fire({
                title: '🏋️ Actividad Creada',
                html: `
                    <div style="text-align: left;">
                        <p><strong>${escapeHtml(newActivity.title)}</strong></p>
                        <p style="color: var(--text-muted); font-size: var(--font-size-sm);">
                            <i class="fas ${newActivity.categoryIcon}"></i> ${newActivity.categoryLabel}
                        </p>
                        <p style="color: var(--text-muted); font-size: var(--font-size-sm);">
                            <i class="fas fa-clock"></i> ${newActivity.formattedDuration} • 
                            <i class="fas fa-signal"></i> ${newActivity.difficultyLabel}
                        </p>
                        ${newActivity.stepCount > 0 ? `
                            <p style="color: var(--text-muted); font-size: var(--font-size-xs); margin-top: 4px;">
                                <i class="fas fa-list-check"></i> ${newActivity.stepCount} pasos definidos
                            </p>
                        ` : ''}
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Ver Actividades',
                cancelButtonText: 'Crear Otra',
                showCancelButton: true,
                customClass: {
                    popup: 'tyr-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm',
                    cancelButton: 'tyr-btn-cancel',
                    actions: 'tyr-actions',
                    closeButton: 'tyr-close-btn'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('/gestionActividades');
                    } else {
                        window.location.href = '/gestionActividades';
                    }
                } else {
                    // Resetear formulario
                    form.reset();
                    // Resetear errores
                    document.querySelectorAll('.form-input.error, .form-textarea.error, .form-select.error').forEach(el => {
                        el.classList.remove('error');
                    });
                    titleInput.focus();
                    // Resetear textarea de pasos
                    stepsTextarea.style.height = 'auto';
                }
            });

        } catch (error) {
            console.error('❌ Error al crear actividad:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo crear la actividad',
                icon: 'error',
                customClass: {
                    popup: 'tyr-popup tyr-error-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm'
                }
            });
        } finally {
            // Habilitar botón
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> GUARDAR ACTIVIDAD';
        }
    }

    // --- 5. Auto-ajuste del textarea ---
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // --- 6. Event Listeners ---
    if (form) {
        form.addEventListener('submit', saveActivity);
    }

    // Auto-ajuste del textarea de pasos
    if (stepsTextarea) {
        stepsTextarea.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
        setTimeout(() => autoResizeTextarea(stepsTextarea), 100);
    }

    // Limpiar errores al escribir
    document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('error');
        });
        input.addEventListener('change', function() {
            this.classList.remove('error');
        });
    });

    // Previene envío accidental con Enter
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    });

    console.log('✅ Event listeners configurados');
}