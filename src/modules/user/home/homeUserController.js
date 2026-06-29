/* ========================================
   homeUserController.js
   Controlador del Dashboard de Usuario - Dinámico con Firestore
   ======================================== */

import { BattleService } from '../../../services/battleService.js';
import { GoalService } from '../../../services/goalService.js';
import { DiaryService } from '../../../services/diaryService.js';

export function homeUserController() {
    console.log('⚔️ Inicializando Home User Dinámico...');

    // --- 1. Estado ---
    let userId = null;
    let userData = null;

    // --- 2. Obtener usuario desde localStorage ---
    function getUserFromLocal() {
        try {
            const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
            if (session && session.id) {
                userId = session.id;
                userData = session;
                console.log('👤 Usuario obtenido:', userData.fullName || userData.firstName);
                return true;
            }
            console.warn('⚠️ No hay usuario autenticado');
            return false;
        } catch (error) {
            console.error('❌ Error al obtener usuario:', error);
            return false;
        }
    }

    // --- 3. Renderizar datos del usuario ---
    function renderUserData() {
        if (!userData) return;

        const nameDisplay = document.getElementById('userNameDisplay');
        if (nameDisplay) {
            const displayName = userData.fullName || userData.firstName || 'Guerrero';
            nameDisplay.textContent = displayName;
        }
    }

    // --- 4. Cargar estadísticas desde Firestore ---
    async function loadStats() {
        if (!userId) return;

        try {
            console.log('📊 Cargando estadísticas...');
            
            // Obtener estadísticas de batallas
            const battleStats = await BattleService.getBattleStats(userId);
            
            // Obtener estadísticas de metas
            const goalStats = await GoalService.getGoalStats(userId);
            
            // Calcular días en libertad (días desde que se registró)
            let freeDays = 0;
            if (userData.createdAt) {
                const createdDate = new Date(userData.createdAt);
                const now = new Date();
                freeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
            }

            // Calcular racha (simulada basada en batallas completadas)
            // Idealmente esto vendría de un campo en el usuario, pero lo calculamos
            const streak = Math.min(battleStats.completed || 0, 30);

            // Nivel mental (basado en metas completadas)
            const mentalLevel = Math.min(Math.floor((goalStats.completed || 0) / 2) + 1, 4);

            // Ofensivas lanzadas (basado en batallas activas + completadas)
            const offensiveCount = (battleStats.inProgress || 0) + (battleStats.completed || 0);

            // Progreso hacia el Valhalla (basado en % de metas completadas)
            const progress = goalStats.total > 0 
                ? Math.round((goalStats.completed / goalStats.total) * 100)
                : 0;

            // Actualizar DOM
            const streakDisplay = document.getElementById('streakDisplay');
            const totalWins = document.getElementById('totalWins');
            const freeDaysDisplay = document.getElementById('freeDays');
            const mentalLevelDisplay = document.getElementById('mentalLevel');
            const offensiveCountDisplay = document.getElementById('offensiveCount');
            const progressFill = document.getElementById('progressFill');
            const progressPercentage = document.getElementById('progressPercentage');

            if (streakDisplay) streakDisplay.textContent = streak;
            if (totalWins) totalWins.textContent = battleStats.completed || 0;
            if (freeDaysDisplay) freeDaysDisplay.textContent = freeDays;
            if (mentalLevelDisplay) mentalLevelDisplay.textContent = `${mentalLevel} / 4`;
            if (offensiveCountDisplay) offensiveCountDisplay.textContent = offensiveCount;
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressPercentage) progressPercentage.textContent = `${progress}%`;

            console.log('✅ Estadísticas actualizadas:', { streak, totalWins: battleStats.completed, freeDays, mentalLevel, offensiveCount, progress });

        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
        }
    }

    // --- 5. Cargar actividades (batallas recientes) ---
    async function loadActivities() {
        if (!userId) return;

        try {
            console.log('⚔️ Cargando actividades...');
            
            const battles = await BattleService.getUserBattles(userId);
            
            // Ordenar por fecha (más recientes primero) y tomar las 5 más recientes
            const recentBattles = battles
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5);

            const activityList = document.getElementById('activityList');
            if (!activityList) return;

            if (recentBattles.length === 0) {
                activityList.innerHTML = `
                    <div class="activity-empty">
                        <i class="fas fa-dumbbell"></i>
                        <p>No hay actividades registradas</p>
                        <span class="empty-sub">Comienza una batalla para verla aquí</span>
                    </div>
                `;
                return;
            }

            const typeIcons = {
                'physical': 'fa-running',
                'mental': 'fa-brain',
                'spiritual': 'fa-spa',
                'social': 'fa-users',
                'creative': 'fa-paint-brush'
            };

            const typeLabels = {
                'physical': 'Físico',
                'mental': 'Mental',
                'spiritual': 'Espiritual',
                'social': 'Social',
                'creative': 'Creativo'
            };

            activityList.innerHTML = recentBattles.map(battle => `
                <div class="activity-item" data-id="${battle.id}">
                    <div class="activity-info">
                        <i class="fas ${typeIcons[battle.type] || 'fa-sword'} activity-icon"></i>
                        <div>
                            <span class="activity-name">${escapeHtml(battle.name)}</span>
                            <span class="activity-description">
                                ${escapeHtml(typeLabels[battle.type] || battle.type)} • 
                                ${battle.durationText || '--'}
                                ${battle.completed ? ' ✅' : ''}
                            </span>
                        </div>
                    </div>
                    <div class="activity-actions">
                        ${!battle.completed ? `
                            <button class="btn btn-sm btn-ghost complete-btn" title="Completar">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-ghost delete-btn" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('❌ Error cargando actividades:', error);
        }
    }

    // --- 6. Cargar metas (con mayor progreso) ---
    async function loadGoals() {
        if (!userId) return;

        try {
            console.log('🎯 Cargando metas...');
            
            const goals = await GoalService.getUserGoals(userId);
            
            // Filtrar solo metas no completadas y ordenar por progreso (mayor primero)
            const activeGoals = goals
                .filter(g => !g.completed)
                .sort((a, b) => b.progressPercentage - a.progressPercentage)
                .slice(0, 5);

            const goalList = document.getElementById('goalList');
            if (!goalList) return;

            if (activeGoals.length === 0) {
                // Si no hay metas activas, mostrar las completadas recientes
                const completedGoals = goals
                    .filter(g => g.completed)
                    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                    .slice(0, 3);

                if (completedGoals.length > 0) {
                    goalList.innerHTML = `
                        <div class="goal-empty">
                            <i class="fas fa-check-circle" style="color: #34d399;"></i>
                            <p>¡Todas tus metas están completadas!</p>
                            <span class="empty-sub">${completedGoals.length} metas completadas recientemente</span>
                        </div>
                        ${completedGoals.map(g => `
                            <div class="goal-item completed" data-id="${g.id}">
                                <div class="goal-info">
                                    <span class="goal-name">✅ ${escapeHtml(g.title)}</span>
                                    <span class="goal-meta">Completada • ${g.formattedDate}</span>
                                </div>
                            </div>
                        `).join('')}
                    `;
                } else {
                    goalList.innerHTML = `
                        <div class="goal-empty">
                            <i class="fas fa-bullseye"></i>
                            <p>No hay metas registradas</p>
                            <span class="empty-sub">Crea tu primera meta para comenzar</span>
                        </div>
                    `;
                }
                return;
            }

            goalList.innerHTML = activeGoals.map(goal => `
                <div class="goal-item" data-id="${goal.id}">
                    <div class="goal-info">
                        <span class="goal-name">${escapeHtml(goal.title)}</span>
                        <div class="goal-progress">
                            <div class="goal-progress-bar" style="width: ${goal.progressPercentage}%;"></div>
                        </div>
                        <span class="goal-meta">${goal.progressPercentage}% completado • ${goal.objectiveCount} objetivos</span>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('❌ Error cargando metas:', error);
        }
    }

    // --- 7. Cargar entradas del diario (últimas 5) ---
    async function loadJournal() {
        if (!userId) return;

        try {
            console.log('📖 Cargando entradas del diario...');
            
            const entries = await DiaryService.getRecentEntries(userId, 5);

            const journalList = document.getElementById('journalList');
            if (!journalList) return;

            if (entries.length === 0) {
                journalList.innerHTML = `
                    <div class="journal-empty">
                        <i class="fas fa-feather-alt"></i>
                        <p>No hay entradas en el diario</p>
                        <span class="empty-sub">Escribe tu primera entrada</span>
                    </div>
                `;
                return;
            }

            const tagMap = {
                'victory': '🏆 VICTORIA',
                'learning': '📖 APRENDIZAJE',
                'battle': '⚔️ BATALLA',
                'reflection': '🧠 REFLEXIÓN',
                'achievement': '⭐ LOGRO'
            };

            const tagClassMap = {
                'victory': 'tag-victoria',
                'learning': 'tag-aprendizaje',
                'battle': 'tag-batalla',
                'reflection': 'tag-reflexion',
                'achievement': 'tag-logro'
            };

            journalList.innerHTML = entries.map(entry => `
                <div class="journal-entry" data-id="${entry.id}">
                    <div class="entry-header">
                        <span class="entry-date">${entry.formattedDate}</span>
                        <span class="entry-tag ${tagClassMap[entry.tag] || 'tag-reflexion'}">
                            ${tagMap[entry.tag] || entry.tag}
                        </span>
                    </div>
                    <p class="entry-content">"${escapeHtml(entry.preview)}"</p>
                    <div class="entry-actions">
                        <button class="btn btn-sm btn-ghost view-entry" title="Ver">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-ghost edit-entry" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-ghost delete-entry" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('❌ Error cargando entradas del diario:', error);
        }
    }

    // --- 8. Helper: escapeHtml ---
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- 9. Navegación a crear ---
    function navigateTo(path) {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo(path);
        } else {
            window.location.href = path;
        }
    }

    // --- 10. Event Listeners ---

    // Agregar Actividad -> Redirige a Crear Batalla
    const addActivityBtn = document.getElementById('addActivityBtn');
    if (addActivityBtn) {
        addActivityBtn.addEventListener('click', () => {
            navigateTo('/crearBatallas');
        });
    }

    // Agregar Meta -> Redirige a Crear Meta
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            navigateTo('/crearMetas');
        });
    }

    // Nueva Entrada de Diario -> Redirige a Crear Diario
    const newEntryBtn = document.getElementById('newEntryBtn');
    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', () => {
            navigateTo('/crearDiario');
        });
    }

    // --- 11. Acciones en lista de actividades (Delegación) ---
    const activityList = document.getElementById('activityList');
    if (activityList) {
        activityList.addEventListener('click', async (e) => {
            const completeBtn = e.target.closest('.complete-btn');
            const deleteBtn = e.target.closest('.delete-btn');

            if (completeBtn) {
                const item = completeBtn.closest('.activity-item');
                if (item) {
                    const battleId = item.dataset.id;
                    try {
                        await BattleService.completeBattle(battleId);
                        showToast('✅ ¡Batalla completada! Bien hecho guerrero.', 'success');
                        // Recargar actividades y estadísticas
                        await loadActivities();
                        await loadStats();
                    } catch (error) {
                        showToast(error.message || 'Error al completar la batalla', 'error');
                    }
                }
            }

            if (deleteBtn) {
                const item = deleteBtn.closest('.activity-item');
                if (item) {
                    const result = await Swal.fire({
                        title: '⚔️ ¿Eliminar actividad?',
                        text: '¿Seguro que quieres eliminar esta batalla?',
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
                            actions: 'tyr-actions'
                        }
                    });

                    if (result.isConfirmed) {
                        try {
                            await BattleService.deleteBattle(item.dataset.id);
                            showToast('🗑️ Batalla eliminada', 'success');
                            await loadActivities();
                            await loadStats();
                        } catch (error) {
                            showToast(error.message || 'Error al eliminar', 'error');
                        }
                    }
                }
            }
        });
    }

    // --- 12. Acciones en el diario (Delegación) ---
    const journalList = document.getElementById('journalList');
    if (journalList) {
        journalList.addEventListener('click', async (e) => {
            const viewBtn = e.target.closest('.view-entry');
            const editBtn = e.target.closest('.edit-entry');
            const deleteBtn = e.target.closest('.delete-entry');

            const entry = e.target.closest('.journal-entry');
            if (!entry) return;
            const entryId = entry.dataset.id;

            if (viewBtn) {
                try {
                    const diaryEntry = await DiaryService.getEntryById(entryId);
                    if (diaryEntry) {
                        const tagMap = {
                            'victory': '🏆 Victoria',
                            'learning': '📖 Aprendizaje',
                            'battle': '⚔️ Batalla',
                            'reflection': '🧠 Reflexión',
                            'achievement': '⭐ Logro'
                        };
                        Swal.fire({
                            title: `📖 ${diaryEntry.title}`,
                            html: `
                                <div style="text-align: left; color: var(--text-secondary);">
                                    <p style="margin-bottom: 8px;">
                                        <strong style="color: var(--text-primary);">📅 Fecha:</strong> ${diaryEntry.formattedDateTime}
                                    </p>
                                    <p style="margin-bottom: 12px;">
                                        <strong style="color: var(--text-primary);">🏷️ Etiqueta:</strong> 
                                        <span class="tag ${diaryEntry.tagClass}">${tagMap[diaryEntry.tag] || diaryEntry.tag}</span>
                                    </p>
                                    <div style="border-top: 1px solid var(--border-tertiary); padding-top: 12px;">
                                        <p style="font-style: italic; line-height: 1.6; color: var(--text-primary);">
                                            "${escapeHtml(diaryEntry.content)}"
                                        </p>
                                    </div>
                                </div>
                            `,
                            confirmButtonText: 'CERRAR',
                            customClass: {
                                popup: 'tyr-popup',
                                title: 'tyr-title',
                                htmlContainer: 'tyr-html',
                                confirmButton: 'tyr-btn-confirm',
                                closeButton: 'tyr-close-btn'
                            }
                        });
                    }
                } catch (error) {
                    showToast('Error al cargar la entrada', 'error');
                }
            }

            if (editBtn) {
                // Redirigir a editar (por ahora solo notificación)
                showToast('✏️ Edición en desarrollo', 'info');
            }

            if (deleteBtn) {
                const result = await Swal.fire({
                    title: '🗑️ ¿Eliminar entrada?',
                    text: '¿Seguro que quieres eliminar esta entrada del diario?',
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
                        actions: 'tyr-actions'
                    }
                });

                if (result.isConfirmed) {
                    try {
                        await DiaryService.deleteEntry(entryId);
                        showToast('🗑️ Entrada eliminada', 'success');
                        await loadJournal();
                    } catch (error) {
                        showToast(error.message || 'Error al eliminar', 'error');
                    }
                }
            }
        });
    }

    // --- 13. Toast ---
    function showToast(message, icon = 'success') {
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

    // --- 14. Escuchar eventos de creación ---
    document.addEventListener('battle:created', () => {
        console.log('🔄 Batalla creada, recargando home...');
        loadActivities();
        loadStats();
    });

    document.addEventListener('goal:created', () => {
        console.log('🔄 Meta creada, recargando home...');
        loadGoals();
        loadStats();
    });

    document.addEventListener('diary:created', () => {
        console.log('🔄 Entrada de diario creada, recargando home...');
        loadJournal();
    });

    // --- 15. Inicializar ---
    async function init() {
        if (!getUserFromLocal()) {
            console.warn('⚠️ Usuario no autenticado, redirigiendo...');
            return;
        }

        renderUserData();
        
        // Cargar todos los datos en paralelo
        await Promise.all([
            loadStats(),
            loadActivities(),
            loadGoals(),
            loadJournal()
        ]);

        console.log('✅ Home User Dinámico inicializado correctamente');
    }

    init();
}