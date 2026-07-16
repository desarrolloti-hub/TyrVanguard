/* ========================================
   MANAGE ACTIVITIES CONTROLLER - Admin
   Gestión de actividades (CRUD en tabla)
   ======================================== */

import { ActivityService } from '../../../services/activityService.js';

// Estado local
let allActivities = [];
let filteredActivities = [];
let currentPage = 1;
const ACTIVITIES_PER_PAGE = 8;

export async function manageActivitiesController() {
    console.log('📋 Manage Activities Controller inicializado');

    // Cargar actividades
    await loadActivities();

    // Configurar event listeners
    setupEventListeners();
}

/**
 * Carga actividades desde el servicio
 */
async function loadActivities() {
    try {
        console.log('📥 Cargando actividades...');

        // ✅ Llamada real al servicio
        allActivities = await ActivityService.getAllActivities();

        // Ordenar por fecha de creación (más reciente primero)
        allActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        applyFilters();
        renderTable();

        console.log(`✅ ${allActivities.length} actividades cargadas`);

    } catch (error) {
        console.error('❌ Error cargando actividades:', error);
        showToast('error', 'Error al cargar las actividades');
        // Si falla, usar datos mock como fallback
        allActivities = getMockActivities();
        applyFilters();
        renderTable();
    }
}

/**
 * Aplica filtros a la lista de actividades
 */
function applyFilters() {
    const search = document.getElementById('activitiesSearchInput')?.value.toLowerCase().trim() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';

    filteredActivities = allActivities.filter(activity => {
        // Filtro por búsqueda
        if (search) {
            const title = activity.title.toLowerCase();
            const description = activity.description.toLowerCase();
            if (!title.includes(search) && !description.includes(search)) {
                return false;
            }
        }

        // Filtro por categoría
        if (category !== 'all' && activity.category !== category) {
            return false;
        }

        // Filtro por estado
        if (status === 'active' && !activity.isActive) return false;
        if (status === 'inactive' && activity.isActive) return false;

        return true;
    });

    currentPage = 1;
}

/**
 * Renderiza la tabla de actividades
 */
function renderTable() {
    const tbody = document.getElementById('activitiesTableBody');
    if (!tbody) return;

    const start = (currentPage - 1) * ACTIVITIES_PER_PAGE;
    const end = start + ACTIVITIES_PER_PAGE;
    const pageActivities = filteredActivities.slice(start, end);

    if (pageActivities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px 20px;color:var(--text-muted);">
                    <i class="fas fa-running" style="font-size:32px;opacity:0.2;display:block;margin-bottom:12px;"></i>
                    ${allActivities.length === 0 ? 'No hay actividades registradas' : 'No se encontraron actividades con los filtros aplicados'}
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }

    tbody.innerHTML = pageActivities.map(activity => `
        <tr>
            <td>
                <div class="manage-activity-cell">
                    <div class="manage-activity-icon ${activity.category}">
                        <i class="fas ${getCategoryIcon(activity.category)}"></i>
                    </div>
                    <div>
                        <div class="manage-activity-name">${activity.title}</div>
                        <span class="manage-activity-desc-small">${activity.description.substring(0, 50)}${activity.description.length > 50 ? '...' : ''}</span>
                    </div>
                </div>
            </td>
            <td>${getCategoryLabel(activity.category)}</td>
            <td>
                <span class="manage-activity-difficulty ${activity.difficulty}">
                    ${getDifficultyLabel(activity.difficulty)}
                </span>
            </td>
            <td>
                <span class="manage-activity-duration">
                    <i class="fas fa-clock"></i> ${activity.duration} min
                </span>
            </td>
            <td>
                <span class="manage-activity-completed">
                    <i class="fas fa-check-circle"></i> ${activity.timesCompleted || 0}
                </span>
            </td>
            <td>
                <span class="manage-activity-status ${activity.isActive ? 'active' : 'inactive'}">
                    <i class="fas fa-circle"></i>
                    ${activity.isActive ? 'Activa' : 'Inactiva'}
                </span>
            </td>
            <td>
                <div class="manage-actions-group">
                    <button class="manage-action-btn view" data-activityid="${activity.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="manage-action-btn edit" data-activityid="${activity.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="manage-action-btn toggle" data-activityid="${activity.id}" title="${activity.isActive ? 'Desactivar' : 'Activar'}">
                        <i class="fas ${activity.isActive ? 'fa-pause-circle' : 'fa-play-circle'}"></i>
                    </button>
                    <button class="manage-action-btn delete" data-activityid="${activity.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    updatePagination();

    // Event listeners a los botones de acción
    document.querySelectorAll('.manage-action-btn.view').forEach(btn => {
        btn.addEventListener('click', () => handleViewActivity(btn.dataset.activityid));
    });

    document.querySelectorAll('.manage-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => handleEditActivity(btn.dataset.activityid));
    });

    document.querySelectorAll('.manage-action-btn.toggle').forEach(btn => {
        btn.addEventListener('click', () => handleToggleActivity(btn.dataset.activityid));
    });

    document.querySelectorAll('.manage-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteActivity(btn.dataset.activityid));
    });
}

/**
 * Actualiza la paginación
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE) || 1;
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const tableInfo = document.getElementById('activitiesTableInfo');

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`;
    
    if (tableInfo) {
        const start = (currentPage - 1) * ACTIVITIES_PER_PAGE + 1;
        const end = Math.min(currentPage * ACTIVITIES_PER_PAGE, filteredActivities.length);
        tableInfo.textContent = `Mostrando ${start} - ${end} de ${filteredActivities.length} actividades${allActivities.length !== filteredActivities.length ? ` (${allActivities.length} total)` : ''}`;
    }
}

/**
 * Obtiene icono según categoría
 */
function getCategoryIcon(category) {
    const icons = {
        deporte: 'fa-running',
        creatividad: 'fa-palette',
        relajacion: 'fa-spa',
        social: 'fa-users',
        aprendizaje: 'fa-graduation-cap',
        domestica: 'fa-home',
        juego: 'fa-gamepad',
        otros: 'fa-star'
    };
    return icons[category] || 'fa-star';
}

/**
 * Obtiene etiqueta de categoría
 */
function getCategoryLabel(category) {
    const labels = {
        deporte: 'Deporte',
        creatividad: 'Creatividad',
        relajacion: 'Relajación',
        social: 'Social',
        aprendizaje: 'Aprendizaje',
        domestica: 'Doméstica',
        juego: 'Juego',
        otros: 'Otros'
    };
    return labels[category] || category;
}

/**
 * Obtiene etiqueta de dificultad
 */
function getDifficultyLabel(difficulty) {
    const labels = {
        easy: '🟢 Fácil',
        medium: '🟡 Media',
        hard: '🔴 Difícil'
    };
    return labels[difficulty] || difficulty;
}

/**
 * Maneja la visualización de una actividad
 */
async function handleViewActivity(activityId) {
    try {
        // ✅ Obtener desde el servicio (con cache)
        const activity = await ActivityService.getActivityById(activityId);
        if (!activity) {
            showToast('error', 'Actividad no encontrada');
            return;
        }

        if (typeof Swal === 'undefined') {
            showToast('info', `Ver: ${activity.title}`);
            return;
        }

        const stepsHtml = activity.steps.map((step, index) => 
            `<div style="display:flex;align-items:flex-start;gap:10px;padding:4px 0;border-bottom:1px solid rgba(124,213,213,0.05);">
                <span style="color:var(--color-secondary);font-weight:700;min-width:24px;">${index + 1}.</span>
                <span style="color:var(--text-secondary);">${step}</span>
            </div>`
        ).join('');

        Swal.fire({
            title: `📋 ${activity.title}`,
            html: `
                <div style="text-align:left;">
                    <p style="color:var(--text-muted);font-size:var(--font-size-sm);margin-bottom:12px;">${activity.description}</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;background:var(--bg-input);padding:12px;border-radius:var(--border-radius-sm);">
                        <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Categoría</span><br><strong>${getCategoryLabel(activity.category)}</strong></div>
                        <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Dificultad</span><br><strong>${getDifficultyLabel(activity.difficulty)}</strong></div>
                        <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Duración</span><br><strong>${activity.duration} min</strong></div>
                        <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Completadas</span><br><strong>${activity.timesCompleted || 0}</strong></div>
                    </div>
                    ${activity.benefits && activity.benefits.length > 0 ? `
                        <div style="margin-bottom:8px;">
                            <strong style="color:var(--text-primary);font-size:var(--font-size-xs);">✨ Beneficios:</strong>
                            <span style="color:var(--text-muted);font-size:var(--font-size-xs);">${activity.benefits.join(', ')}</span>
                        </div>
                    ` : ''}
                    <div style="background:var(--bg-input);padding:12px 16px;border-radius:var(--border-radius-sm);border:1px solid var(--border-tertiary);">
                        <strong style="color:var(--text-primary);font-size:var(--font-size-sm);display:block;margin-bottom:8px;">
                            <i class="fas fa-list-ol" style="color:var(--color-secondary);"></i> Pasos:
                        </strong>
                        ${stepsHtml}
                    </div>
                    ${activity.resources && activity.resources.length > 0 ? `
                        <div style="margin-top:8px;">
                            <strong style="color:var(--text-muted);font-size:var(--font-size-xs);">🔧 Recursos:</strong>
                            <span style="color:var(--text-muted);font-size:var(--font-size-xs);">${activity.resources.join(', ')}</span>
                        </div>
                    ` : ''}
                </div>
            `,
            showCloseButton: true,
            focusConfirm: false,
            confirmButtonText: 'CERRAR',
            customClass: {
                popup: 'tyr-popup',
                title: 'tyr-title',
                htmlContainer: 'tyr-html',
                confirmButton: 'tyr-btn-confirm',
                closeButton: 'tyr-close-btn'
            }
        });
    } catch (error) {
        console.error('Error al ver actividad:', error);
        showToast('error', 'Error al cargar los detalles');
    }
}

/**
 * Maneja la edición de una actividad
 */
function handleEditActivity(activityId) {
    showToast('info', `✏️ Editando actividad...`);
    // Aquí iría la lógica de edición (redirigir a formulario con datos)
}

/**
 * Maneja activar/desactivar una actividad
 */
async function handleToggleActivity(activityId) {
    try {
        const activity = await ActivityService.getActivityById(activityId);
        if (!activity) {
            showToast('error', 'Actividad no encontrada');
            return;
        }

        const action = activity.isActive ? 'desactivar' : 'activar';
        const actionText = activity.isActive ? 'DESACTIVAR' : 'ACTIVAR';
        const statusText = activity.isActive ? 'inactiva' : 'activa';

        if (typeof Swal === 'undefined') {
            if (confirm(`¿${actionText} "${activity.title}"?`)) {
                if (activity.isActive) {
                    await ActivityService.deactivateActivity(activityId);
                } else {
                    await ActivityService.activateActivity(activityId);
                }
                showToast('success', `Actividad ${activity.isActive ? 'desactivada' : 'activada'} correctamente`);
                await loadActivities();
            }
            return;
        }

        const confirm = await Swal.fire({
            title: `¿${actionText} actividad?`,
            html: `
                <p>Estás a punto de <strong>${action}</strong> "<strong>${activity.title}</strong>"</p>
                <p style="font-size:0.9rem;color:var(--text-muted);">La actividad quedará ${statusText} para los usuarios</p>
            `,
            icon: activity.isActive ? 'warning' : 'info',
            showCancelButton: true,
            confirmButtonText: actionText,
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'tyr-popup',
                title: 'tyr-title',
                htmlContainer: 'tyr-html',
                confirmButton: 'tyr-btn-confirm',
                cancelButton: 'tyr-btn-cancel'
            }
        });

        if (confirm.isConfirmed) {
            if (activity.isActive) {
                await ActivityService.deactivateActivity(activityId);
            } else {
                await ActivityService.activateActivity(activityId);
            }
            showToast('success', `Actividad ${activity.isActive ? 'desactivada' : 'activada'} correctamente`);
            await loadActivities();
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        showToast('error', error.message || 'Error al cambiar estado');
    }
}

/**
 * Maneja la eliminación de una actividad
 */
async function handleDeleteActivity(activityId) {
    try {
        const activity = await ActivityService.getActivityById(activityId);
        if (!activity) {
            showToast('error', 'Actividad no encontrada');
            return;
        }

        if (typeof Swal === 'undefined') {
            if (confirm(`¿Eliminar "${activity.title}"?`)) {
                await ActivityService.deleteActivity(activityId);
                showToast('success', 'Actividad eliminada correctamente');
                await loadActivities();
            }
            return;
        }

        const confirm = await Swal.fire({
            title: '¿Eliminar actividad?',
            html: `
                <p>Estás a punto de eliminar "<strong>${activity.title}</strong>"</p>
                <p style="font-size:0.9rem;color:var(--text-muted);">Esta acción no se puede deshacer</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'tyr-popup',
                title: 'tyr-title',
                htmlContainer: 'tyr-html',
                confirmButton: 'tyr-btn-confirm',
                cancelButton: 'tyr-btn-cancel'
            }
        });

        if (confirm.isConfirmed) {
            await ActivityService.deleteActivity(activityId);
            showToast('success', 'Actividad eliminada correctamente');
            await loadActivities();
        }
    } catch (error) {
        console.error('Error al eliminar actividad:', error);
        showToast('error', error.message || 'Error al eliminar');
    }
}

/**
 * Muestra un toast con SweetAlert2
 */
function showToast(icon, message) {
    if (typeof Swal === 'undefined') {
        console.log(`[${icon}] ${message}`);
        return;
    }

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
            popup: 'tyr-popup tyr-toast',
            title: 'tyr-title',
            htmlContainer: 'tyr-html'
        }
    });
}

/**
 * Datos mock para fallback
 */
function getMockActivities() {
    return [
        {
            id: 'mock_1',
            title: '20 Flexiones de Guerrero',
            description: 'Ejercicio de fuerza para despejar la mente y fortalecer el cuerpo',
            category: 'deporte',
            difficulty: 'medium',
            duration: 10,
            benefits: ['Fortaleza física', 'Disciplina', 'Claridad mental'],
            steps: ['Paso 1', 'Paso 2', 'Paso 3'],
            resources: ['Ropa cómoda'],
            tags: ['físico', 'fuerza'],
            imageURL: '',
            timesCompleted: 0,
            isActive: true,
            createdAt: new Date().toISOString()
        }
    ];
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('activitiesSearchInput');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                applyFilters();
                renderTable();
            }, 300);
        });
    }

    // Filtro de categoría
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            applyFilters();
            renderTable();
        });
    }

    // Filtro de estado
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            applyFilters();
            renderTable();
        });
    }

    // Paginación
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }

    // Botón actualizar
    const refreshBtn = document.getElementById('refreshActivitiesBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CARGANDO...';
            await loadActivities();
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ACTUALIZAR';
            refreshBtn.disabled = false;
        });
    }
}