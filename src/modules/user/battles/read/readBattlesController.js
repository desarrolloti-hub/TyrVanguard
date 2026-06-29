/* ========================================
   readBattlesController.js
   Controlador para listar y gestionar batallas
   ======================================== */

import { BattleService, BATTLE_TYPES, BATTLE_STATUS } from '../../../../services/battleService.js';

export function readBattlesController() {
    console.log('⚔️ Inicializando Bitácora de Batallas...');

    // --- 1. Estado ---
    let battles = [];
    let currentPage = 1;
    const itemsPerPage = 5;
    let filteredBattles = [];
    let currentStatus = 'all';
    let currentType = 'all';
    let searchTerm = '';
    let userId = null;

    // --- 2. DOM References ---
    const tableBody = document.getElementById('battlesTableBody');
    const emptyState = document.getElementById('battlesEmpty');
    const battleCount = document.getElementById('battleCount');
    const completedCount = document.getElementById('completedCount');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const searchInput = document.getElementById('searchBattle');
    const filterStatus = document.getElementById('filterStatus');
    const filterType = document.getElementById('filterType');

    // --- 3. Mapeo de tipos (Inglés -> Español para mostrar) ---
    const typeConfig = {
        'physical': { icon: 'fa-running', label: 'Físico', class: 'type-fisico' },
        'mental': { icon: 'fa-brain', label: 'Mental', class: 'type-mental' },
        'spiritual': { icon: 'fa-spa', label: 'Espiritual', class: 'type-espiritual' },
        'social': { icon: 'fa-users', label: 'Social', class: 'type-social' },
        'creative': { icon: 'fa-paint-brush', label: 'Creativo', class: 'type-creativo' }
    };

    // --- 4. Mapeo de estados (Inglés -> Español) ---
    const statusConfig = {
        'pending': { label: 'Pendiente', icon: 'fa-clock', class: 'pending' },
        'in_progress': { label: 'En Curso', icon: 'fa-spinner', class: 'in-progress' },
        'completed': { label: 'Completada', icon: 'fa-check-circle', class: 'completed' },
        'abandoned': { label: 'Abandonada', icon: 'fa-times-circle', class: 'abandoned' },
        'failed': { label: 'Fallida', icon: 'fa-skull', class: 'failed' }
    };

    // --- 5. Cargar datos desde Firestore ---
    async function loadBattles() {
        try {
            // Obtener usuario actual
            const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
            if (!session || !session.id) {
                console.warn('⚠️ Usuario no autenticado');
                return;
            }
            
            userId = session.id;
            console.log('👤 Cargando batallas para usuario:', userId);
            
            // Obtener batallas del servicio
            const battleList = await BattleService.getUserBattles(userId);
            battles = battleList;
            
            console.log(`✅ ${battles.length} batallas cargadas`);
            render();
        } catch (error) {
            console.error('❌ Error cargando batallas:', error);
            showToast('Error al cargar las batallas', 'error');
        }
    }

    // --- 6. Render ---
    function render() {
        // Aplicar filtros
        filteredBattles = battles.filter(battle => {
            const matchesSearch = battle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (battle.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            // Mapear estado para filtro
            let battleStatus = 'pending';
            if (battle.completed) battleStatus = 'completed';
            else if (battle.status === 'in_progress') battleStatus = 'in_progress';
            else if (battle.status === 'abandoned') battleStatus = 'abandoned';
            else if (battle.status === 'failed') battleStatus = 'failed';
            
            const matchesStatus = currentStatus === 'all' || 
                                  (currentStatus === 'completed' && battle.completed) ||
                                  (currentStatus === 'pending' && !battle.completed && battle.status !== 'in_progress') ||
                                  (currentStatus === 'in_progress' && battle.status === 'in_progress') ||
                                  (currentStatus === 'abandoned' && battle.status === 'abandoned') ||
                                  (currentStatus === 'failed' && battle.status === 'failed');
            
            const matchesType = currentType === 'all' || battle.type === currentType;
            
            return matchesSearch && matchesStatus && matchesType;
        });

        // Actualizar contadores
        if (battleCount) {
            battleCount.textContent = filteredBattles.length;
        }
        if (completedCount) {
            completedCount.textContent = filteredBattles.filter(b => b.completed).length;
        }

        // Paginación
        const totalPages = Math.ceil(filteredBattles.length / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageBattles = filteredBattles.slice(start, end);

        // Mostrar/ocultar estado vacío
        if (filteredBattles.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            if (tableBody) tableBody.innerHTML = '';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            renderTableRows(pageBattles);
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

    function renderTableRows(battlesToRender) {
        if (!tableBody) return;

        if (battlesToRender.length === 0) {
            tableBody.innerHTML = '';
            return;
        }

        tableBody.innerHTML = battlesToRender.map(battle => {
            const type = typeConfig[battle.type] || typeConfig['physical'];
            
            // Determinar estado para mostrar
            let statusInfo;
            if (battle.completed) {
                statusInfo = statusConfig['completed'];
            } else if (battle.status === 'in_progress') {
                statusInfo = statusConfig['in_progress'];
            } else if (battle.status === 'abandoned') {
                statusInfo = statusConfig['abandoned'];
            } else if (battle.status === 'failed') {
                statusInfo = statusConfig['failed'];
            } else {
                statusInfo = statusConfig['pending'];
            }

            return `
                <tr class="battle-row" data-id="${battle.id}" data-completed="${battle.completed}">
                    <td data-label="Estado">
                        <span class="status-badge ${statusInfo.class}">
                            <i class="fas ${statusInfo.icon}"></i>
                            ${statusInfo.label}
                        </span>
                    </td>
                    <td data-label="Nombre">${escapeHtml(battle.name)}</td>
                    <td data-label="Tipo">
                        <span class="type-tag ${type.class}">
                            <i class="fas ${type.icon}"></i> ${type.label}
                        </span>
                    </td>
                    <td data-label="Descripción">${escapeHtml(battle.description || 'Sin descripción')}</td>
                    <td data-label="Duración">${battle.durationText || '--'}</td>
                    <td data-label="Fecha">${battle.formattedDate || '--'}</td>
                    <td data-label="Acciones" class="actions-cell">
                        ${!battle.completed ? `
                            <button class="btn btn-sm complete-battle" title="Completar">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-ghost edit-battle" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-ghost delete-battle" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
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

    async function toggleComplete(id) {
        try {
            const battle = battles.find(b => b.id === id);
            if (!battle) return;

            if (battle.completed) {
                // Si ya está completada, no hacer nada
                showToast('⚠️ Esta batalla ya está completada', 'warning');
                return;
            }

            // Completar batalla usando el servicio
            const updatedBattle = await BattleService.completeBattle(id);
            
            // Actualizar en la lista local
            const index = battles.findIndex(b => b.id === id);
            if (index !== -1) {
                battles[index] = updatedBattle;
            }
            
            render();
            showToast('🏆 Batalla completada con éxito!', 'success');
        } catch (error) {
            console.error('Error al completar batalla:', error);
            showToast(error.message || 'Error al completar la batalla', 'error');
        }
    }

    async function deleteBattle(id) {
        const result = await Swal.fire({
            title: '⚔️ ¿Eliminar Batalla?',
            text: '¿Estás seguro de que quieres eliminar esta batalla? Esta acción no se puede deshacer.',
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
                await BattleService.deleteBattle(id);
                battles = battles.filter(b => b.id !== id);
                render();
                showToast('🗑️ Batalla eliminada correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar batalla:', error);
                showToast(error.message || 'Error al eliminar la batalla', 'error');
            }
        }
    }

    // --- 8. Navegación ---
    function navigateToCreateBattle() {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/crearBatallas');
        } else {
            window.location.href = '/crearBatallas';
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

    // NUEVA BATALLA
    const newBattleBtn = document.getElementById('newBattleBtn');
    const emptyNewBattleBtn = document.getElementById('emptyNewBattleBtn');
    
    if (newBattleBtn) {
        newBattleBtn.addEventListener('click', navigateToCreateBattle);
    }
    if (emptyNewBattleBtn) {
        emptyNewBattleBtn.addEventListener('click', navigateToCreateBattle);
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

    if (filterType) {
        filterType.addEventListener('change', (e) => {
            currentType = e.target.value;
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
            const totalPages = Math.ceil(filteredBattles.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                render();
            }
        });
    }

    // Acciones de la tabla (delegación de eventos)
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const row = btn.closest('.battle-row');
            if (!row) return;

            const id = row.dataset.id;

            if (btn.classList.contains('complete-battle')) {
                toggleComplete(id);
            } else if (btn.classList.contains('edit-battle')) {
                showToast('✏️ Función de edición en desarrollo', 'info');
            } else if (btn.classList.contains('delete-battle')) {
                deleteBattle(id);
            }
        });
    }

    // --- 11. Escuchar evento de batalla creada ---
    document.addEventListener('battle:created', (e) => {
        const newBattle = e.detail;
        if (newBattle) {
            // Recargar batallas desde Firestore
            loadBattles();
            showToast('⚔️ Nueva batalla agregada!', 'success');
        }
    });

    // --- 12. Inicializar ---
    loadBattles();
    console.log('✅ Bitácora de Batallas inicializada correctamente');
}