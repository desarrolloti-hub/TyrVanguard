/* ========================================
   readGoalsController.js
   Controlador para listar y gestionar metas
   ======================================== */

import { GoalService, GOAL_CATEGORIES, GOAL_STATUS } from '../../../../services/goalService.js';

export function readGoalsController() {
    console.log('🎯 Inicializando Mis Metas...');

    // --- 1. Estado ---
    let goals = [];
    let currentPage = 1;
    const itemsPerPage = 6;
    let filteredGoals = [];
    let currentStatus = 'all';
    let currentCategory = 'all';
    let searchTerm = '';
    let userId = null;

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

    // --- 3. Categorías (Inglés -> Español) ---
    const categoryConfig = {
        'personal': { icon: 'fa-user', label: 'Personal', class: 'category-personal' },
        'professional': { icon: 'fa-briefcase', label: 'Profesional', class: 'category-profesional' },
        'health': { icon: 'fa-heart', label: 'Salud', class: 'category-salud' },
        'spiritual': { icon: 'fa-spa', label: 'Espiritual', class: 'category-espiritual' },
        'social': { icon: 'fa-users', label: 'Social', class: 'category-social' }
    };

    // --- 4. Mapeo de estados (Inglés -> Español) ---
    const statusConfig = {
        'pending': { label: 'Pendiente', icon: 'fa-clock', class: 'pending' },
        'in_progress': { label: 'En Curso', icon: 'fa-spinner', class: 'in-progress' },
        'completed': { label: 'Completada', icon: 'fa-check-circle', class: 'completed' },
        'abandoned': { label: 'Abandonada', icon: 'fa-times-circle', class: 'abandoned' }
    };

    // --- 5. Cargar datos desde Firestore ---
    async function loadGoals() {
        try {
            // Obtener usuario actual
            const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
            if (!session || !session.id) {
                console.warn('⚠️ Usuario no autenticado');
                return;
            }
            
            userId = session.id;
            console.log('👤 Cargando metas para usuario:', userId);
            
            // Obtener metas del servicio
            const goalList = await GoalService.getUserGoals(userId);
            goals = goalList;
            
            console.log(`✅ ${goals.length} metas cargadas`);
            render();
        } catch (error) {
            console.error('❌ Error cargando metas:', error);
            showToast('Error al cargar las metas', 'error');
        }
    }

    // --- 6. Render ---
    function render() {
        // Aplicar filtros
        filteredGoals = goals.filter(goal => {
            const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (goal.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            // Determinar estado para filtro
            let goalStatus = 'pending';
            if (goal.completed) goalStatus = 'completed';
            else if (goal.status === 'in_progress') goalStatus = 'in_progress';
            else if (goal.status === 'abandoned') goalStatus = 'abandoned';
            
            const matchesStatus = currentStatus === 'all' || 
                                  (currentStatus === 'completed' && goal.completed) ||
                                  (currentStatus === 'pending' && !goal.completed && goal.status !== 'in_progress') ||
                                  (currentStatus === 'in_progress' && goal.status === 'in_progress') ||
                                  (currentStatus === 'abandoned' && goal.status === 'abandoned');
            
            const matchesCategory = currentCategory === 'all' || goal.category === currentCategory;
            
            return matchesSearch && matchesStatus && matchesCategory;
        });

        // Actualizar contadores
        if (goalCount) {
            goalCount.textContent = filteredGoals.length;
        }
        if (completedCount) {
            const completed = filteredGoals.filter(g => g.completed).length;
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
            const isCompleted = goal.completed;
            const progress = goal.progressPercentage || 0;
            
            const category = categoryConfig[goal.category] || categoryConfig['personal'];
            
            // Determinar estado para mostrar
            let statusInfo;
            if (goal.completed) {
                statusInfo = statusConfig['completed'];
            } else if (goal.status === 'in_progress') {
                statusInfo = statusConfig['in_progress'];
            } else if (goal.status === 'abandoned') {
                statusInfo = statusConfig['abandoned'];
            } else {
                statusInfo = statusConfig['pending'];
            }

            return `
                <div class="goal-card ${isCompleted ? 'completed' : ''}" data-id="${goal.id}">
                    <div class="goal-card-header">
                        <div class="goal-card-title-group">
                            <h3 class="goal-card-title">${escapeHtml(goal.title)}</h3>
                            <span class="goal-card-category ${category.class}">
                                <i class="fas ${category.icon}"></i> ${category.label}
                            </span>
                        </div>
                        <span class="goal-card-status ${statusInfo.class}">
                            <i class="fas ${statusInfo.icon}"></i>
                            ${statusInfo.label}
                        </span>
                    </div>
                    
                    <p class="goal-card-description">${escapeHtml(goal.description || 'Sin descripción')}</p>

                    <!-- Objetivos -->
                    <div class="goal-objectives">
                        ${(goal.objectives || []).map((obj, index) => `
                            <div class="objective-item" data-objective-index="${index}">
                                <button class="objective-check ${obj.completed ? 'completed' : ''}" data-objective-index="${index}" ${isCompleted ? 'disabled' : ''}>
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
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- 7. CRUD Operations con Servicio ---

    async function toggleObjective(goalId, objectiveIndex) {
        try {
            const goal = goals.find(g => g.id === goalId);
            if (!goal) return;

            if (goal.completed) {
                showToast('⚠️ Esta meta ya está completada', 'warning');
                return;
            }

            // Completar objetivo usando el servicio
            const updatedGoal = await GoalService.completeObjective(goalId, objectiveIndex);
            
            // Actualizar en la lista local
            const index = goals.findIndex(g => g.id === goalId);
            if (index !== -1) {
                goals[index] = updatedGoal;
            }
            
            render();
            
            const objective = updatedGoal.objectives[objectiveIndex];
            showToast(
                objective.completed ? '✅ Objetivo completado' : '⏳ Objetivo pendiente',
                'success'
            );
        } catch (error) {
            console.error('Error al completar objetivo:', error);
            showToast(error.message || 'Error al completar el objetivo', 'error');
        }
    }

    async function deleteGoal(goalId) {
        const result = await Swal.fire({
            title: '🎯 ¿Eliminar Meta?',
            text: '¿Estás seguro de que quieres eliminar esta meta? Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'SÍ, ELIMINAR',
            cancelButtonText: 'CANCELAR',
            customClass: {
                popup: 'tyr-popup',
                title: 'tyr-title',
                htmlContainer: 'tyr-html',
                confirmButton: 'tyr-btn-confirm',
                cancelButton: 'tyr-btn-cancel',
                actions: 'tyr-actions',
                closeButton: 'tyr-close-btn'
            }
        });

        if (result.isConfirmed) {
            try {
                await GoalService.deleteGoal(goalId);
                goals = goals.filter(g => g.id !== goalId);
                render();
                showToast('🗑️ Meta eliminada correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar meta:', error);
                showToast(error.message || 'Error al eliminar la meta', 'error');
            }
        }
    }

    // --- 8. Navegación ---
    function navigateToCreateGoal() {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/crearMetas');
        } else {
            window.location.href = '/crearMetas';
        }
    }

    // --- 9. Toast ---
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

    // --- 10. Event Listeners ---

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
            if (checkBtn && !checkBtn.disabled) {
                const objectiveIndex = parseInt(checkBtn.dataset.objectiveIndex);
                const goalCard = checkBtn.closest('.goal-card');
                if (goalCard) {
                    const goalId = goalCard.dataset.id;
                    toggleObjective(goalId, objectiveIndex);
                }
                return;
            }

            // Editar
            const editBtn = e.target.closest('.edit-goal');
            if (editBtn) {
                const goalId = editBtn.dataset.id;
                showToast('✏️ Edición en desarrollo', 'info');
                return;
            }

            // Eliminar
            const deleteBtn = e.target.closest('.delete-goal');
            if (deleteBtn) {
                const goalId = deleteBtn.dataset.id;
                deleteGoal(goalId);
                return;
            }
        });
    }

    // --- 11. Escuchar evento de meta creada ---
    document.addEventListener('goal:created', (e) => {
        const newGoal = e.detail;
        if (newGoal) {
            // Recargar metas desde Firestore
            loadGoals();
            showToast('🎯 Nueva meta creada!', 'success');
        }
    });

    // --- 12. Inicializar ---
    loadGoals();
    console.log('✅ Mis Metas inicializado correctamente');
}