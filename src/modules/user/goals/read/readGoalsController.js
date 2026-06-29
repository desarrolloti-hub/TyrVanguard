/* ========================================
   readGoalsController.js
   Controlador para listar y gestionar metas
   ======================================== */

export function readGoalsController() {
    console.log('🎯 Inicializando Mis Metas...');

    // --- 1. Estado ---
    let goals = [
        {
            id: 1,
            title: 'Llegar a 30 días de racha',
            category: 'personal',
            description: 'Mantener la disciplina diaria para alcanzar los 30 días de racha.',
            objectives: [
                { id: 1, text: 'Completar 7 días de racha', completed: false },
                { id: 2, text: 'Completar 14 días de racha', completed: false },
                { id: 3, text: 'Completar 21 días de racha', completed: false },
                { id: 4, text: 'Completar 30 días de racha', completed: false }
            ],
            createdAt: '2026-06-01'
        },
        {
            id: 2,
            title: 'Meditar diario',
            category: 'espiritual',
            description: 'Establecer el hábito de meditar 15 minutos cada mañana.',
            objectives: [
                { id: 1, text: 'Meditar 7 días seguidos', completed: true },
                { id: 2, text: 'Meditar 14 días seguidos', completed: true },
                { id: 3, text: 'Meditar 21 días seguidos', completed: true },
                { id: 4, text: 'Meditar 30 días seguidos', completed: true }
            ],
            createdAt: '2026-06-10'
        }
    ];

    let currentPage = 1;
    const itemsPerPage = 6;
    let filteredGoals = [...goals];
    let currentStatus = 'all';
    let currentCategory = 'all';
    let searchTerm = '';

    // --- 2. DOM References ---
    const goalsGrid = document.getElementById('goalsGrid');
    const emptyState = document.getElementById('goalsEmpty');
    const goalCount = document.getElementById('goalCount');
    const completedCount = document.getElementById('completedCount');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const searchInput = document.getElementById('searchGoal');
    const filterStatus = document.getElementById('filterStatus');
    const filterCategory = document.getElementById('filterCategory');

    // --- 3. Categorías ---
    const categoryConfig = {
        personal: { icon: 'fa-user', label: 'Personal', class: 'category-personal' },
        profesional: { icon: 'fa-briefcase', label: 'Profesional', class: 'category-profesional' },
        salud: { icon: 'fa-heart', label: 'Salud', class: 'category-salud' },
        espiritual: { icon: 'fa-spa', label: 'Espiritual', class: 'category-espiritual' },
        social: { icon: 'fa-users', label: 'Social', class: 'category-social' }
    };

    // --- 4. Render ---
    function render() {
        // Aplicar filtros
        filteredGoals = goals.filter(goal => {
            const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  goal.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            const isCompleted = goal.objectives.every(obj => obj.completed);
            const matchesStatus = currentStatus === 'all' || 
                                  (currentStatus === 'completed' && isCompleted) ||
                                  (currentStatus === 'pending' && !isCompleted);
            
            const matchesCategory = currentCategory === 'all' || goal.category === currentCategory;
            
            return matchesSearch && matchesStatus && matchesCategory;
        });

        // Actualizar contadores
        if (goalCount) {
            goalCount.textContent = filteredGoals.length;
        }
        if (completedCount) {
            const completed = filteredGoals.filter(g => g.objectives.every(obj => obj.completed)).length;
            completedCount.textContent = completed;
        }

        // Paginación
        const totalPages = Math.ceil(filteredGoals.length / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageGoals = filteredGoals.slice(start, end);

        // Mostrar/ocultar estado vacío
        if (filteredGoals.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            if (goalsGrid) goalsGrid.innerHTML = '';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            renderGoalCards(pageGoals);
        }

        // Actualizar paginación
        if (paginationInfo) {
            paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        }
        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage <= 1;
        }
        if (nextPageBtn) {
            nextPageBtn.disabled = currentPage >= totalPages;
        }
    }

    function renderGoalCards(goalsToRender) {
        if (!goalsGrid) return;

        if (goalsToRender.length === 0) {
            goalsGrid.innerHTML = '';
            return;
        }

        goalsGrid.innerHTML = goalsToRender.map(goal => {
            const isCompleted = goal.objectives.every(obj => obj.completed);
            const progress = goal.objectives.length > 0 
                ? Math.round((goal.objectives.filter(obj => obj.completed).length / goal.objectives.length) * 100)
                : 0;
            
            const category = categoryConfig[goal.category] || categoryConfig.personal;

            return `
                <div class="goal-card ${isCompleted ? 'completed' : ''}" data-id="${goal.id}">
                    <div class="goal-card-header">
                        <div class="goal-card-title-group">
                            <h3 class="goal-card-title">${escapeHtml(goal.title)}</h3>
                            <span class="goal-card-category ${category.class}">
                                <i class="fas ${category.icon}"></i> ${category.label}
                            </span>
                        </div>
                        <span class="goal-card-status ${isCompleted ? 'completed' : 'pending'}">
                            <i class="fas ${isCompleted ? 'fa-check-circle' : 'fa-clock'}"></i>
                            ${isCompleted ? 'Completada' : 'En progreso'}
                        </span>
                    </div>
                    
                    <p class="goal-card-description">${escapeHtml(goal.description)}</p>

                    <!-- Objetivos -->
                    <div class="goal-objectives">
                        ${goal.objectives.map(obj => `
                            <div class="objective-item" data-objective-id="${obj.id}">
                                <button class="objective-check ${obj.completed ? 'completed' : ''}" data-objective-id="${obj.id}">
                                    <i class="fas ${obj.completed ? 'fa-check-square' : 'fa-square'}"></i>
                                </button>
                                <span class="objective-text ${obj.completed ? 'completed' : ''}">${escapeHtml(obj.text)}</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Barra de progreso -->
                    <div class="goal-progress-container">
                        <div class="goal-progress-header">
                            <span class="goal-progress-label">Progreso</span>
                            <span class="goal-progress-percentage">${progress}%</span>
                        </div>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill ${isCompleted ? 'completed' : ''}" style="width: ${progress}%;"></div>
                        </div>
                    </div>

                    <!-- Acciones -->
                    <div class="goal-card-actions">
                        <button class="btn btn-sm btn-ghost edit-goal" data-id="${goal.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-ghost delete-goal" data-id="${goal.id}" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- 5. CRUD Operations ---

    function toggleObjective(goalId, objectiveId) {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            const objective = goal.objectives.find(obj => obj.id === objectiveId);
            if (objective) {
                objective.completed = !objective.completed;
                render();
                
                const allCompleted = goal.objectives.every(obj => obj.completed);
                showToast(
                    objective.completed ? '✅ Objetivo completado' : '⏳ Objetivo pendiente',
                    'success'
                );
            }
        }
    }

    function deleteGoal(id) {
        if (confirm('🎯 ¿Estás seguro de eliminar esta meta?')) {
            goals = goals.filter(g => g.id !== id);
            render();
            showToast('🗑️ Meta eliminada', 'info');
        }
    }

    // --- 6. Navegación a crear meta ---
    function navigateToCreateGoal() {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/crearMeta');
        } else {
            window.location.href = '/crearMeta';
        }
    }

    // --- 7. Toast notifications ---
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

    // --- 8. Event Listeners ---

    // Nueva meta
    const newGoalBtn = document.getElementById('newGoalBtn');
    const emptyNewGoalBtn = document.getElementById('emptyNewGoalBtn');
    
    if (newGoalBtn) {
        newGoalBtn.addEventListener('click', navigateToCreateGoal);
    }
    if (emptyNewGoalBtn) {
        emptyNewGoalBtn.addEventListener('click', navigateToCreateGoal);
    }

    // Búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            currentPage = 1;
            render();
        });
    }

    // Filtros
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            currentStatus = e.target.value;
            currentPage = 1;
            render();
        });
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            currentPage = 1;
            render();
        });
    }

    // Paginación
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                render();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredGoals.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                render();
            }
        });
    }

    // Acciones de la tarjeta (delegación de eventos)
    if (goalsGrid) {
        goalsGrid.addEventListener('click', (e) => {
            // Toggle objetivo
            const checkBtn = e.target.closest('.objective-check');
            if (checkBtn) {
                const objectiveId = parseInt(checkBtn.dataset.objectiveId);
                const goalCard = checkBtn.closest('.goal-card');
                if (goalCard) {
                    const goalId = parseInt(goalCard.dataset.id);
                    toggleObjective(goalId, objectiveId);
                }
                return;
            }

            // Editar
            const editBtn = e.target.closest('.edit-goal');
            if (editBtn) {
                const goalId = parseInt(editBtn.dataset.id);
                showToast('✏️ Edición en desarrollo', 'info');
                return;
            }

            // Eliminar
            const deleteBtn = e.target.closest('.delete-goal');
            if (deleteBtn) {
                const goalId = parseInt(deleteBtn.dataset.id);
                deleteGoal(goalId);
                return;
            }
        });
    }

    // --- 9. Escuchar evento de meta creada ---
    document.addEventListener('goal:created', (e) => {
        const newGoal = e.detail;
        if (newGoal) {
            goals.unshift({
                id: newGoal.id || Date.now(),
                title: newGoal.title,
                category: newGoal.category || 'personal',
                description: newGoal.description || '',
                objectives: newGoal.objectives || [],
                createdAt: new Date().toISOString()
            });
            render();
            showToast('🎯 Nueva meta creada', 'success');
        }
    });

    // --- 10. Inicializar ---
    render();
    console.log('✅ Mis Metas inicializado correctamente');
}