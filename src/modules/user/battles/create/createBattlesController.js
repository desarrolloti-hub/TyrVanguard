/* ========================================
   battleCreateController.js
   Controlador para crear nuevas batallas
   ======================================== */

export function battleCreateController() {
    console.log('⚔️ Inicializando Creación de Batalla...');

    // --- 1. DOM References ---
    const form = document.getElementById('battleCreateForm');
    const nameInput = document.getElementById('battleName');
    const typeInput = document.getElementById('battleType');
    const durationInput = document.getElementById('battleDuration');
    const durationUnitInput = document.getElementById('battleDurationUnit');
    const descriptionInput = document.getElementById('battleDescription');
    const goalsInput = document.getElementById('battleGoals');
    const nameError = document.getElementById('nameError');
    const durationError = document.getElementById('durationError');
    const cancelBtn = document.getElementById('cancelBattleBtn');
    const cancelFormBtn = document.getElementById('cancelFormBtn');

    // --- 2. Validación ---
    function validateForm() {
        let isValid = true;

        // Validar nombre
        const name = nameInput.value.trim();
        if (!name || name.length < 2) {
            nameInput.classList.add('error');
            nameError.style.display = 'flex';
            isValid = false;
        } else {
            nameInput.classList.remove('error');
            nameError.style.display = 'none';
        }

        // Validar tipo
        if (!typeInput.value) {
            typeInput.classList.add('error');
            isValid = false;
        } else {
            typeInput.classList.remove('error');
        }

        // Validar duración
        const duration = parseInt(durationInput.value);
        if (!duration || duration < 1) {
            durationInput.classList.add('error');
            durationError.style.display = 'flex';
            isValid = false;
        } else {
            durationInput.classList.remove('error');
            durationError.style.display = 'none';
        }

        return isValid;
    }

    // --- 3. Guardar batalla ---
    function saveBattle(event) {
        event.preventDefault();

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

        // Obtener valores
        const name = nameInput.value.trim();
        const type = typeInput.value;
        const duration = parseInt(durationInput.value);
        const unit = durationUnitInput.value;
        const description = descriptionInput.value.trim();
        const goals = goalsInput.value.trim();

        // Formatear duración
        const durationText = `${duration} ${unit}`;

        // Crear objeto de batalla
        const newBattle = {
            id: Date.now(),
            name: name,
            type: type,
            duration: duration,
            durationUnit: unit,
            durationText: durationText,
            description: description || 'Sin descripción',
            goals: goals ? goals.split('\n').filter(g => g.trim()) : [],
            date: new Date().toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            completed: false
        };

        console.log('⚔️ Nueva batalla creada:', newBattle);

        // Mostrar éxito
        Swal.fire({
            title: '⚔️ Batalla Registrada',
            html: `
                <div style="text-align: left;">
                    <p><strong>${name}</strong></p>
                    <p style="color: var(--text-muted); font-size: var(--font-size-sm);">
                        <i class="fas fa-clock"></i> ${durationText} &bull; 
                        <span class="type-tag type-${type}" style="display: inline-flex; padding: 2px 10px;">
                            ${typeInput.options[typeInput.selectedIndex].text}
                        </span>
                    </p>
                    ${description ? `<p style="color: var(--text-secondary); font-size: var(--font-size-sm);">${description}</p>` : ''}
                    ${goals ? `<p style="color: var(--text-muted); font-size: var(--font-size-xs);">🎯 ${goals.split('\n').filter(g => g.trim()).length} metas definidas</p>` : ''}
                </div>
            `,
            icon: 'success',
            confirmButtonText: '⚔️ IR A MIS BATALLAS',
            cancelButtonText: 'CREAR OTRA',
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
                // Ir a lista de batallas
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/batallas');
                } else {
                    window.location.href = '/batallas';
                }
            } else {
                // Resetear formulario
                form.reset();
                durationInput.value = 30;
                // Remover clases de error
                document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => {
                    el.classList.remove('error');
                });
                document.querySelectorAll('.form-error').forEach(el => {
                    el.style.display = 'none';
                });
                // Focus en nombre
                nameInput.focus();
            }
        });
    }

    // --- 4. Event Listeners ---

    // Submit form
    if (form) {
        form.addEventListener('submit', saveBattle);
    }

    // Cancelar (volver)
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/batallas');
            } else {
                window.location.href = '/batallas';
            }
        });
    }

    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', () => {
            if (form) {
                // Verificar si hay cambios
                const hasChanges = nameInput.value.trim() || 
                                  descriptionInput.value.trim() || 
                                  goalsInput.value.trim();
                
                if (hasChanges) {
                    Swal.fire({
                        title: '⚠️ ¿Cancelar?',
                        text: 'Tienes cambios sin guardar. ¿Seguro que quieres salir?',
                        icon: 'warning',
                        confirmButtonText: 'SÍ, SALIR',
                        cancelButtonText: 'SEGUIR EDITANDO',
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
                                window.navigateTo('/batallas');
                            } else {
                                window.location.href = '/batallas';
                            }
                        }
                    });
                } else {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('/batallas');
                    } else {
                        window.location.href = '/batallas';
                    }
                }
            }
        });
    }

    // --- 5. Inicializar ---
    console.log('✅ Creación de Batalla inicializada correctamente');
}