/* ========================================
   READ ACTIVITIES CONTROLLER
   Visualización de actividades distractoras (Usuario)
   ======================================== */

import { ActivityService } from '../../../services/activityService.js';

// Estado local
let allActivities = [];
let filteredActivities = [];
let completedActivities = [];

export async function readActivitiesController() {
    console.log('📖 Read Activities Controller inicializado');

    // Cargar actividades completadas del usuario
    loadCompletedActivities();

    // Cargar actividades
    await loadActivities();

    // Configurar event listeners
    setupEventListeners();
}

/**
 * Carga actividades completadas del localStorage
 */
function loadCompletedActivities() {
    try {
        const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
        const userId = session?.id || 'anonymous';
        const key = `completed_activities_${userId}`;
        completedActivities = JSON.parse(localStorage.getItem(key) || '[]');
        console.log(`✅ ${completedActivities.length} actividades completadas`);
    } catch (error) {
        console.error('Error cargando actividades completadas:', error);
        completedActivities = [];
    }
}

/**
 * Guarda actividades completadas en localStorage
 */
function saveCompletedActivities() {
    try {
        const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
        const userId = session?.id || 'anonymous';
        const key = `completed_activities_${userId}`;
        localStorage.setItem(key, JSON.stringify(completedActivities));
    } catch (error) {
        console.error('Error guardando actividades completadas:', error);
    }
}

/**
 * Carga actividades desde el servicio
 */
async function loadActivities() {
    try {
        console.log('📥 Cargando actividades...');

        // ✅ Llamada real al servicio (solo activas)
        allActivities = await ActivityService.getActiveActivities();

        // Marcar actividades completadas
        allActivities = allActivities.map(activity => ({
            ...activity,
            isCompleted: completedActivities.includes(activity.id)
        }));

        applyFilters();
        renderActivities();

        console.log(`✅ ${allActivities.length} actividades cargadas`);

    } catch (error) {
        console.error('❌ Error cargando actividades:', error);
        showToast('error', 'Error al cargar las actividades');
        // Fallback con datos mock
        allActivities = getMockActivities();
        applyFilters();
        renderActivities();
    }
}

/**
 * Aplica filtros a la lista de actividades
 */
function applyFilters() {
    const search = document.getElementById('activitiesSearchInput')?.value.toLowerCase().trim() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const difficulty = document.getElementById('difficultyFilter')?.value || 'all';
    const duration = document.getElementById('durationFilter')?.value || 'all';

    filteredActivities = allActivities.filter(activity => {
        // Filtro por búsqueda
        if (search) {
            const title = activity.title.toLowerCase();
            const description = activity.description.toLowerCase();
            const tags = activity.tags?.join(' ').toLowerCase() || '';
            if (!title.includes(search) && !description.includes(search) && !tags.includes(search)) {
                return false;
            }
        }

        // Filtro por categoría
        if (category !== 'all' && activity.category !== category) {
            return false;
        }

        // Filtro por dificultad
        if (difficulty !== 'all' && activity.difficulty !== difficulty) {
            return false;
        }

        // Filtro por duración
        if (duration !== 'all') {
            const durationNum = parseInt(duration);
            if (durationNum <= 10 && activity.duration > 10) return false;
            if (durationNum === 15 && (activity.duration < 15 || activity.duration > 20)) return false;
            if (durationNum === 30 && (activity.duration < 30 || activity.duration > 45)) return false;
            if (durationNum === 60 && activity.duration < 60) return false;
        }

        return true;
    });
}

/**
 * Renderiza las actividades
 */
function renderActivities() {
    const grid = document.getElementById('activitiesGrid');
    if (!grid) return;

    if (filteredActivities.length === 0) {
        grid.innerHTML = `
            <div class="activity-empty">
                <i class="fas fa-running"></i>
                <p>No hay actividades disponibles</p>
                <span>${allActivities.length === 0 ? 'Vuelve más tarde para encontrar nuevas misiones' : 'No se encontraron actividades con los filtros aplicados'}</span>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredActivities.map(activity => `
        <div class="activity-card" data-activityid="${activity.id}">
            <div class="activity-card-header">
                <div class="activity-icon ${activity.category}">
                    <i class="fas ${getCategoryIcon(activity.category)}"></i>
                </div>
                <div class="activity-badges">
                    <span class="activity-difficulty ${activity.difficulty}">
                        ${getDifficultyLabel(activity.difficulty)}
                    </span>
                    <span class="activity-duration">
                        <i class="fas fa-clock"></i> ${activity.duration} min
                    </span>
                </div>
            </div>
            <div class="activity-card-body">
                <h3 class="activity-title">${activity.title}</h3>
                <p class="activity-description">${activity.description}</p>
                ${activity.tags && activity.tags.length > 0 ? `
                    <div class="activity-tags">
                        ${activity.tags.map(tag => `<span class="activity-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="activity-card-footer">
                <div class="activity-stats">
                    <span><i class="fas fa-check-circle"></i> ${activity.timesCompleted || 0} completadas</span>
                </div>
                <div class="activity-action">
                    <button class="btn-start ${activity.isCompleted ? 'completed' : ''}" data-activityid="${activity.id}">
                        ${activity.isCompleted ? '✅ COMPLETADA' : '▶ INICIAR'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Event listeners para iniciar actividad
    document.querySelectorAll('.btn-start').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleStartActivity(btn.dataset.activityid);
        });
    });

    // Event listeners para ver detalle
    document.querySelectorAll('.activity-card').forEach(card => {
        card.addEventListener('click', () => {
            handleViewActivity(card.dataset.activityid);
        });
    });
}

/**
 * Maneja el inicio de una actividad
 */
async function handleStartActivity(activityId) {
    try {
        const activity = await ActivityService.getActivityById(activityId);
        if (!activity) {
            showToast('error', 'Actividad no encontrada');
            return;
        }

        // Si ya está completada, mostrar mensaje
        if (completedActivities.includes(activityId)) {
            showToast('info', `Ya completaste "${activity.title}"`);
            return;
        }

        if (typeof Swal === 'undefined') {
            showToast('info', `Iniciando: ${activity.title}`);
            return;
        }

        // Mostrar modal con los pasos
        const stepsHtml = activity.steps.map((step, index) => 
            `<div style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;border-bottom:1px solid rgba(124,213,213,0.05);">
                <span style="color:var(--color-secondary);font-weight:700;min-width:24px;">${index + 1}.</span>
                <span style="color:var(--text-secondary);">${step}</span>
            </div>`
        ).join('');

        const confirm = await Swal.fire({
            title: `🏋️ ${activity.title}`,
            html: `
                <div style="text-align:left;max-height:300px;overflow-y:auto;padding:4px 0;">
                    <p style="color:var(--text-muted);font-size:var(--font-size-sm);margin-bottom:12px;">
                        <i class="fas fa-clock" style="color:var(--color-secondary);"></i> 
                        Duración: ${activity.duration} minutos • 
                        <i class="fas fa-signal" style="color:var(--color-secondary);"></i> 
                        Dificultad: ${getDifficultyLabel(activity.difficulty)}
                    </p>
                    <div style="background:var(--bg-input);padding:12px 16px;border-radius:var(--border-radius-sm);border:1px solid var(--border-tertiary);">
                        <strong style="color:var(--text-primary);font-size:var(--font-size-sm);display:block;margin-bottom:8px;">
                            <i class="fas fa-list-ol" style="color:var(--color-secondary);"></i> Pasos a seguir:
                        </strong>
                        ${stepsHtml}
                    </div>
                    ${activity.benefits && activity.benefits.length > 0 ? `
                        <div style="margin-top:12px;padding:8px 12px;background:rgba(52,211,153,0.05);border:1px solid rgba(52,211,153,0.1);border-radius:var(--border-radius-sm);">
                            <strong style="color:#34d399;font-size:var(--font-size-xs);">
                                <i class="fas fa-star"></i> Beneficios:
                            </strong>
                            <span style="color:var(--text-muted);font-size:var(--font-size-xs);">${activity.benefits.join(', ')}</span>
                        </div>
                    ` : ''}
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '✅ COMPLETAR',
            cancelButtonText: 'CERRAR',
            customClass: {
                popup: 'tyr-popup',
                title: 'tyr-title',
                htmlContainer: 'tyr-html',
                confirmButton: 'tyr-btn-confirm',
                cancelButton: 'tyr-btn-cancel'
            }
        });

        if (confirm.isConfirmed) {
            // Marcar como completada
            if (!completedActivities.includes(activityId)) {
                completedActivities.push(activityId);
                saveCompletedActivities();

                // ✅ Incrementar contador en Firestore
                await ActivityService.incrementCompleted(activityId);

                showToast('success', `🎉 ¡Completaste "${activity.title}"! Sigue así guerrero.`);

                // Disparar evento
                document.dispatchEvent(new CustomEvent('activity:completed', {
                    detail: { activityId, title: activity.title }
                }));

                // Recargar vista
                await loadActivities();
            }
        }
    } catch (error) {
        console.error('Error al iniciar actividad:', error);
        showToast('error', error.message || 'Error al procesar la actividad');
    }
}

/**
 * Maneja la visualización de una actividad (detalle rápido)
 */
function handleViewActivity(activityId) {
    const activity = allActivities.find(a => a.id === activityId);
    if (!activity) {
        showToast('error', 'Actividad no encontrada');
        return;
    }
    showToast('info', `📖 ${activity.title} - ${activity.duration} min`);
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
            isActive: true
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
                renderActivities();
            }, 300);
        });
    }

    // Filtro de categoría
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            applyFilters();
            renderActivities();
        });
    }

    // Filtro de dificultad
    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', () => {
            applyFilters();
            renderActivities();
        });
    }

    // Filtro de duración
    const durationFilter = document.getElementById('durationFilter');
    if (durationFilter) {
        durationFilter.addEventListener('change', () => {
            applyFilters();
            renderActivities();
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