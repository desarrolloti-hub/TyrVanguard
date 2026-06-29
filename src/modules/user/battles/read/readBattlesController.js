/* ========================================
   readBattlesController.js
   Controlador para listar y gestionar batallas
   ======================================== */

export function readBattlesController() {
    console.log('⚔️ Inicializando Bitácora de Batallas...');

    // --- 1. Estado ---
    let battles = [
        {
            id: 1,
            name: 'Ejercicio Físico',
            type: 'fisico',
            description: '30 min de cardio matutino',
            date: '25 de Junio, 2026',
            completed: false,
            duration: 30,
            durationUnit: 'minutos',
            durationText: '30 minutos'
        },
        {
            id: 2,
            name: 'Lectura Motivacional',
            type: 'mental',
            description: '10 min de lectura de filosofía',
            date: '24 de Junio, 2026',
            completed: true,
            duration: 10,
            durationUnit: 'minutos',
            durationText: '10 minutos'
        },
        {
            id: 3,
            name: 'Meditación Guiada',
            type: 'espiritual',
            description: '15 min de meditación para enfocar la mente',
            date: '23 de Junio, 2026',
            completed: false,
            duration: 15,
            durationUnit: 'minutos',
            durationText: '15 minutos'
        }
    ];

    let currentPage = 1;
    const itemsPerPage = 5;
    let filteredBattles = [...battles];
    let currentStatus = 'all';
    let currentType = 'all';
    let searchTerm = '';

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

    // --- 3. Mapeo de tipos a iconos ---
    const typeConfig = {
        fisico: { icon: 'fa-running', label: 'Físico', class: 'type-fisico' },
        mental: { icon: 'fa-brain', label: 'Mental', class: 'type-mental' },
        espiritual: { icon: 'fa-spa', label: 'Espiritual', class: 'type-espiritual' },
        social: { icon: 'fa-users', label: 'Social', class: 'type-social' },
        creativo: { icon: 'fa-paint-brush', label: 'Creativo', class: 'type-creativo' }
    };

    // --- 4. Render ---
    function render() {
        // Aplicar filtros
        filteredBattles = battles.filter(battle => {
            const matchesSearch = battle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  battle.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = currentStatus === 'all' || 
                                  (currentStatus === 'completed' && battle.completed) ||
                                  (currentStatus === 'pending' && !battle.completed);
            
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
            const type = typeConfig[battle.type] || typeConfig.fisico;
            return `
                <tr class="battle-row" data-id="${battle.id}" data-completed="${battle.completed}">
                    <td data-label="Estado">
                        <span class="status-badge ${battle.completed ? 'completed' : 'pending'}">
                            <i class="fas ${battle.completed ? 'fa-check-circle' : 'fa-clock'}"></i>
                            ${battle.completed ? 'Completada' : 'Pendiente'}
                        </span>
                    </td>
                    <td data-label="Nombre">${escapeHtml(battle.name)}</td>
                    <td data-label="Tipo">
                        <span class="type-tag ${type.class}">
                            <i class="fas ${type.icon}"></i> ${type.label}
                        </span>
                    </td>
                    <td data-label="Descripción">${escapeHtml(battle.description)}</td>
                    <td data-label="Fecha">${battle.date}</td>
                    <td data-label="Acciones" class="actions-cell">
                        <button class="btn btn-sm complete-battle" title="Completar" ${battle.completed ? 'disabled' : ''}>
                            <i class="fas fa-check"></i>
                        </button>
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- 5. CRUD Operations ---

    function toggleComplete(id) {
        const battle = battles.find(b => b.id === id);
        if (battle) {
            battle.completed = !battle.completed;
            render();
            showToast(battle.completed ? '✅ Batalla completada' : '⏳ Batalla pendiente', 'success');
        }
    }

    function deleteBattle(id) {
        if (confirm('⚔️ ¿Estás seguro de eliminar esta batalla?')) {
            battles = battles.filter(b => b.id !== id);
            render();
            showToast('🗑️ Batalla eliminada');
        }
    }

    // --- 6. Navegación a crear batalla ---
    function navigateToCreateBattle() {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/crearBatallas');
        } else {
            window.location.href = '/crearBatallas';
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

    // NUEVA BATALLA - Redirige a /crearBatallas
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

            const id = parseInt(row.dataset.id);

            if (btn.classList.contains('complete-battle')) {
                toggleComplete(id);
            } else if (btn.classList.contains('edit-battle')) {
                // Aquí puedes redirigir a editar o abrir modal
                showToast('✏️ Función de edición en desarrollo', 'info');
            } else if (btn.classList.contains('delete-battle')) {
                deleteBattle(id);
            }
        });
    }

    // --- 9. Escuchar evento de batalla creada ---
    document.addEventListener('battle:created', (e) => {
        const newBattle = e.detail;
        if (newBattle) {
            battles.unshift({
                id: newBattle.id || Date.now(),
                name: newBattle.name,
                type: newBattle.type || 'fisico',
                description: newBattle.description || 'Sin descripción',
                date: new Date().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }),
                completed: false,
                duration: newBattle.duration || 0,
                durationUnit: newBattle.durationUnit || 'minutos',
                durationText: newBattle.durationText || '--'
            });
            render();
            showToast('⚔️ Nueva batalla agregada a la lista', 'success');
        }
    });

    // --- 10. Inicializar ---
    render();
    console.log('✅ Bitácora de Batallas inicializada correctamente');
}