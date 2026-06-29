/* ========================================
   createGoalController.js
   Controlador para crear nuevas metas
   ======================================== */

import { GoalService, GOAL_CATEGORIES } from '../../../../services/goalService.js';

export function createGoalController() {
    console.log('🎯 Inicializando Creación de Meta...');

    // --- 1. DOM References ---
    const form = document.getElementById('goalCreateForm');
    const titleInput = document.getElementById('goalTitle');
    const categoryInput = document.getElementById('goalCategory');
    const descriptionInput = document.getElementById('goalDescription');
    const objectivesList = document.getElementById('objectivesList');
    const addObjectiveBtn = document.getElementById('addObjectiveBtn');
    const titleError = document.getElementById('titleError');
    const objectivesError = document.getElementById('objectivesError');
    const cancelBtn = document.getElementById('cancelGoalBtn');
    const cancelFormBtn = document.getElementById('cancelFormBtn');

    // --- MAPEO DE CATEGORÍAS (Español -> Inglés) ---
    const CATEGORY_MAP = {
        'personal': GOAL_CATEGORIES.PERSONAL,
        'profesional': GOAL_CATEGORIES.PROFESIONAL,
        'salud': GOAL_CATEGORIES.SALUD,
        'espiritual': GOAL_CATEGORIES.ESPIRITUAL,
        'social': GOAL_CATEGORIES.SOCIAL
    };

    let objectiveCounter = 0;

    // --- 2. Funciones de objetivos ---

    function createObjectiveInput(value = '') {
        objectiveCounter++;
        const div = document.createElement('div');
        div.className = 'objective-input-group';
        div.dataset.id = objectiveCounter;
        div.innerHTML = `
            <div class="input-icon-wrapper">
                <i class="fas fa-check-circle input-icon" style="color: #34d399;"></i>
                <input 
                    type="text" 
                    class="form-input objective-input" 
                    placeholder="Ej: Completar 7 días de racha"
                    value="${escapeHtml(value)}"
                />
            </div>
            <button type="button" class="btn btn-sm remove-objective" title="Eliminar objetivo">
                <i class="fas fa-times"></i>
            </button>
        `;

        const removeBtn = div.querySelector('.remove-objective');
        removeBtn.addEventListener('click', () => {
            if (objectivesList.children.length > 1) {
                div.remove();
                updateRemoveButtons();
            } else {
                showToast('Debes tener al menos un objetivo', 'warning');
            }
        });

        const input = div.querySelector('.objective-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addObjectiveInput();
            }
        });

        return div;
    }

    function addObjectiveInput(value = '') {
        const newObjective = createObjectiveInput(value);
        objectivesList.appendChild(newObjective);
        const input = newObjective.querySelector('.objective-input');
        setTimeout(() => input.focus(), 50);
        updateRemoveButtons();
    }

    function updateRemoveButtons() {
        const removeBtns = objectivesList.querySelectorAll('.remove-objective');
        removeBtns.forEach((btn) => {
            btn.style.display = objectivesList.children.length <= 1 ? 'none' : 'flex';
        });
    }

    function getObjectives() {
        const inputs = objectivesList.querySelectorAll('.objective-input');
        const objectives = [];
        inputs.forEach(input => {
            const text = input.value.trim();
            if (text) {
                objectives.push({
                    id: Date.now() + objectives.length,
                    text: text,
                    completed: false
                });
            }
        });
        return objectives;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- 3. Validación ---
    function validateForm() {
        let isValid = true;

        const title = titleInput.value.trim();
        if (!title || title.length < 2) {
            titleInput.classList.add('error');
            titleError.style.display = 'flex';
            isValid = false;
        } else {
            titleInput.classList.remove('error');
            titleError.style.display = 'none';
        }

        if (!categoryInput.value) {
            categoryInput.classList.add('error');
            isValid = false;
        } else {
            categoryInput.classList.remove('error');
        }

        const objectives = getObjectives();
        if (objectives.length === 0) {
            objectivesError.style.display = 'flex';
            isValid = false;
        } else {
            objectivesError.style.display = 'none';
        }

        return isValid;
    }

    // --- 4. Guardar meta usando el servicio ---
    async function saveGoal(event) {
        event.preventDefault();

        if (!validateForm()) {
            Swal.fire({
                title: '🎯 Campos inválidos',
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
            // Obtener usuario actual
            const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
            if (!session || !session.id) {
                throw new Error('Debes iniciar sesión para crear una meta');
            }

            // Mapear categoría de español a inglés
            const categorySpanish = categoryInput.value;
            const categoryEnglish = CATEGORY_MAP[categorySpanish];
            
            if (!categoryEnglish) {
                throw new Error(`Categoría no válida: ${categorySpanish}`);
            }

            // Obtener valores
            const goalData = {
                title: titleInput.value.trim(),
                category: categoryEnglish,
                description: descriptionInput.value.trim(),
                objectives: getObjectives()
            };

            console.log('📦 Datos a enviar al servicio:', goalData);

            // Crear meta usando el servicio
            const newGoal = await GoalService.createGoal(session.id, goalData);
            
            console.log('🎯 Nueva meta creada:', newGoal);

            // Disparar evento para actualizar la lista
            document.dispatchEvent(new CustomEvent('goal:created', {
                detail: newGoal
            }));

            // Mostrar éxito
            Swal.fire({
                title: '🎯 Meta Creada',
                html: `
                    <div style="text-align: left;">
                        <p><strong>${escapeHtml(newGoal.title)}</strong></p>
                        <p style="color: var(--text-muted); font-size: var(--font-size-sm);">
                            <i class="fas ${newGoal.categoryIcon}"></i> ${newGoal.categoryLabel}
                        </p>
                        ${newGoal.description ? `<p style="color: var(--text-secondary); font-size: var(--font-size-sm);">${escapeHtml(newGoal.description)}</p>` : ''}
                        <p style="color: var(--text-muted); font-size: var(--font-size-xs); margin-top: 4px;">
                            <i class="fas fa-list-check"></i> ${newGoal.objectiveCount} objetivos definidos
                        </p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: '🎯 IR A MIS METAS',
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
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('/metas');
                    } else {
                        window.location.href = '/metas';
                    }
                } else {
                    form.reset();
                    objectivesList.innerHTML = '';
                    addObjectiveInput('');
                    document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => {
                        el.classList.remove('error');
                    });
                    document.querySelectorAll('.form-error').forEach(el => {
                        el.style.display = 'none';
                    });
                    titleInput.focus();
                }
            });

        } catch (error) {
            console.error('Error al crear meta:', error);
            Swal.fire({
                title: '❌ Error',
                text: error.message || 'No se pudo crear la meta',
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

    // --- 5. Toast ---
    function showToast(message, icon = 'info') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
                popup: 'tyr-popup',
                title: 'tyr-title',
                htmlContainer: 'tyr-html',
                closeButton: 'tyr-close-btn'
            }
        });
        Toast.fire({ icon, title: message });
    }

    // --- 6. Event Listeners ---

    if (form) {
        form.addEventListener('submit', saveGoal);
    }

    if (addObjectiveBtn) {
        addObjectiveBtn.addEventListener('click', () => addObjectiveInput(''));
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/metas');
            } else {
                window.location.href = '/metas';
            }
        });
    }

    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', () => {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/metas');
            } else {
                window.location.href = '/metas';
            }
        });
    }

    // --- 7. Inicializar ---
    addObjectiveInput('');
    updateRemoveButtons();

    console.log('✅ Creación de Meta inicializada correctamente');
}