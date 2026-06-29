/* ========================================
   createGoalController.js
   Controlador para crear nuevas metas
   ======================================== */

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

        // Evento para eliminar
        const removeBtn = div.querySelector('.remove-objective');
        removeBtn.addEventListener('click', () => {
            if (objectivesList.children.length > 1) {
                div.remove();
                updateRemoveButtons();
            } else {
                showToast('Debes tener al menos un objetivo', 'warning');
            }
        });

        // Evento para Enter (crear nuevo)
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
        // Enfocar el nuevo input
        const input = newObjective.querySelector('.objective-input');
        setTimeout(() => input.focus(), 50);
        updateRemoveButtons();
    }

    function updateRemoveButtons() {
        const removeBtns = objectivesList.querySelectorAll('.remove-objective');
        removeBtns.forEach((btn, index) => {
            if (objectivesList.children.length <= 1) {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'flex';
            }
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

        // Validar título
        const title = titleInput.value.trim();
        if (!title || title.length < 2) {
            titleInput.classList.add('error');
            titleError.style.display = 'flex';
            isValid = false;
        } else {
            titleInput.classList.remove('error');
            titleError.style.display = 'none';
        }

        // Validar categoría
        if (!categoryInput.value) {
            categoryInput.classList.add('error');
            isValid = false;
        } else {
            categoryInput.classList.remove('error');
        }

        // Validar objetivos
        const objectives = getObjectives();
        if (objectives.length === 0) {
            objectivesError.style.display = 'flex';
            isValid = false;
        } else {
            objectivesError.style.display = 'none';
        }

        return isValid;
    }

    // --- 4. Guardar meta ---
    function saveGoal(event) {
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

        // Obtener valores
        const title = titleInput.value.trim();
        const category = categoryInput.value;
        const description = descriptionInput.value.trim();
        const objectives = getObjectives();

        // Crear objeto de meta
        const newGoal = {
            id: Date.now(),
            title: title,
            category: category,
            description: description || 'Sin descripción',
            objectives: objectives,
            createdAt: new Date().toISOString()
        };

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
                    <p><strong>${escapeHtml(title)}</strong></p>
                    <p style="color: var(--text-muted); font-size: var(--font-size-sm);">
                        <i class="fas fa-tag"></i> ${categoryInput.options[categoryInput.selectedIndex].text}
                    </p>
                    ${description ? `<p style="color: var(--text-secondary); font-size: var(--font-size-sm);">${escapeHtml(description)}</p>` : ''}
                    <p style="color: var(--text-muted); font-size: var(--font-size-xs); margin-top: 4px;">
                        <i class="fas fa-list-check"></i> ${objectives.length} objetivos definidos
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
                // Ir a lista de metas
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/metas');
                } else {
                    window.location.href = '/metas';
                }
            } else {
                // Resetear formulario
                form.reset();
                // Limpiar objetivos y dejar solo uno vacío
                objectivesList.innerHTML = '';
                addObjectiveInput('');
                // Remover clases de error
                document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => {
                    el.classList.remove('error');
                });
                document.querySelectorAll('.form-error').forEach(el => {
                    el.style.display = 'none';
                });
                // Focus en título
                titleInput.focus();
            }
        });
    }

    // --- 5. Toast notifications ---
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
        Toast.fire({
            icon: icon,
            title: message
        });
    }

    // --- 6. Event Listeners ---

    // Submit form
    if (form) {
        form.addEventListener('submit', saveGoal);
    }

    // Agregar objetivo
    if (addObjectiveBtn) {
        addObjectiveBtn.addEventListener('click', () => addObjectiveInput(''));
    }

    // Cancelar (volver)
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
    // Crear un objetivo por defecto
    addObjectiveInput('');
    updateRemoveButtons();

    console.log('✅ Creación de Meta inicializada correctamente');
}