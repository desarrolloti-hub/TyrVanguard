/* ========================================
   STATS CONTROLLER - Estadísticas del sistema
   ======================================== */

import { AdminService } from '../../../services/adminService.js';
import { UserService } from '../../../services/userService.js';
import { BattleService } from '../../../services/battleService.js';
import { GoalService } from '../../../services/goalService.js';
import { DiaryService } from '../../../services/diaryService.js';

// Estado local
let allUsers = [];
let allBattles = [];
let allGoals = [];
let allDiaries = [];

export async function statsController() {
    console.log('📊 Stats Controller inicializado');

    // Verificar autenticación
    if (!AdminService.isAuthenticated()) {
        console.warn('🔒 No autenticado, redirigiendo...');
        window.location.href = '/iniciarSesion';
        return;
    }

    // Cargar datos
    await loadStatsData();

    // Event listeners
    setupEventListeners();
}

/**
 * Carga todos los datos de estadísticas
 */
async function loadStatsData() {
    try {
        console.log('📊 Cargando estadísticas del sistema...');

        // Cargar todos los datos en paralelo
        const [users, battles, goals, diaries] = await Promise.all([
            UserService.getUsers(),
            getAllBattles(),
            getAllGoals(),
            getAllDiaries()
        ]);

        allUsers = users;
        allBattles = battles;
        allGoals = goals;
        allDiaries = diaries;

        // Actualizar todas las métricas
        updateOverviewStats(users, battles, goals, diaries);
        updateCharts(users, battles, goals, diaries);
        updateDistribution(users);
        updateMetrics(users, battles, goals, diaries);
        updateRecentActivity(users, battles, goals, diaries);
        updateLastUpdateTime();

        console.log('✅ Estadísticas cargadas correctamente');

    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        showToast('error', 'Error al cargar las estadísticas del sistema');
    }
}

/**
 * Obtiene todas las batallas de todos los usuarios
 */
async function getAllBattles() {
    try {
        const users = await UserService.getUsers();
        let allBattles = [];

        for (const user of users) {
            try {
                const battles = await BattleService.getUserBattles(user.id);
                allBattles = allBattles.concat(battles.map(b => ({ ...b, userId: user.id })));
            } catch (e) {
                // Usuario sin batallas
            }
        }

        return allBattles;
    } catch (error) {
        console.error('Error obteniendo batallas:', error);
        return [];
    }
}

/**
 * Obtiene todas las metas de todos los usuarios
 */
async function getAllGoals() {
    try {
        const users = await UserService.getUsers();
        let allGoals = [];

        for (const user of users) {
            try {
                const goals = await GoalService.getUserGoals(user.id);
                allGoals = allGoals.concat(goals.map(g => ({ ...g, userId: user.id })));
            } catch (e) {
                // Usuario sin metas
            }
        }

        return allGoals;
    } catch (error) {
        console.error('Error obteniendo metas:', error);
        return [];
    }
}

/**
 * Obtiene todas las entradas de diario de todos los usuarios
 */
async function getAllDiaries() {
    try {
        const users = await UserService.getUsers();
        let allDiaries = [];

        for (const user of users) {
            try {
                const diaries = await DiaryService.getUserEntries(user.id);
                allDiaries = allDiaries.concat(diaries.map(d => ({ ...d, userId: user.id })));
            } catch (e) {
                // Usuario sin diario
            }
        }

        return allDiaries;
    } catch (error) {
        console.error('Error obteniendo diarios:', error);
        return [];
    }
}

/**
 * Actualiza las tarjetas de vista general
 */
function updateOverviewStats(users, battles, goals, diaries) {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const totalBattles = battles.length;
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const totalDiaries = diaries.length;
    const admins = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;

    // Actualizar valores
    document.getElementById('statsTotalUsers').textContent = totalUsers;
    document.getElementById('statsActiveUsers').textContent = activeUsers;
    document.getElementById('statsTotalBattles').textContent = totalBattles;
    document.getElementById('statsCompletedGoals').textContent = completedGoals;
    document.getElementById('statsDiaryEntries').textContent = totalDiaries;
    document.getElementById('statsAdmins').textContent = admins;

    // Calcular crecimiento (simulado con datos de ejemplo)
    const growth = (value, base = 10) => {
        const g = Math.round((value / (base || 1)) * 10);
        return g > 0 ? `+${g}%` : `${g}%`;
    };

    document.getElementById('userGrowth').textContent = growth(totalUsers);
    document.getElementById('activeGrowth').textContent = growth(activeUsers);
    document.getElementById('battleGrowth').textContent = growth(totalBattles, 5);
    document.getElementById('goalGrowth').textContent = growth(completedGoals, 3);
    document.getElementById('diaryGrowth').textContent = growth(totalDiaries, 4);
}

/**
 * Actualiza los gráficos de barras
 */
function updateCharts(users, battles, goals, diaries) {
    // Obtener últimos 7 días
    const days = getLast7Days();
    
    // Datos de crecimiento de usuarios
    const userData = days.map(day => {
        return users.filter(u => {
            const date = new Date(u.createdAt);
            return date.toDateString() === day.toDateString();
        }).length;
    });

    // Datos de actividad (batallas + metas + diario)
    const activityData = days.map(day => {
        const dayStr = day.toDateString();
        const battleCount = battles.filter(b => {
            const date = new Date(b.createdAt || b.startedAt);
            return date.toDateString() === dayStr;
        }).length;
        const goalCount = goals.filter(g => {
            const date = new Date(g.createdAt);
            return date.toDateString() === dayStr;
        }).length;
        const diaryCount = diaries.filter(d => {
            const date = new Date(d.createdAt);
            return date.toDateString() === dayStr;
        }).length;
        return battleCount + goalCount + diaryCount;
    });

    renderChart('userGrowthBars', 'userGrowthLabels', userData, days);
    renderChart('activityBars', 'activityLabels', activityData, days);
}

/**
 * Obtiene los últimos 7 días
 */
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
    }
    return days;
}

/**
 * Renderiza un gráfico de barras
 */
function renderChart(barsId, labelsId, data, days) {
    const barsContainer = document.getElementById(barsId);
    const labelsContainer = document.getElementById(labelsId);

    if (!barsContainer || !labelsContainer) return;

    const max = Math.max(...data, 1);

    barsContainer.innerHTML = data.map((value, index) => {
        const height = (value / max) * 100;
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const dayName = dayNames[days[index].getDay()];
        
        return `
            <div class="admin-stats-chart-bar" style="height: ${Math.max(height, 4)}%;" title="${dayName}: ${value}">
                <span class="bar-value">${value}</span>
            </div>
        `;
    }).join('');

    labelsContainer.innerHTML = days.map(day => {
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return `<span class="admin-stats-chart-label">${dayNames[day.getDay()]}</span>`;
    }).join('');
}

/**
 * Actualiza la distribución de usuarios
 */
function updateDistribution(users) {
    const total = users.length || 1;
    const active = users.filter(u => u.isActive).length;
    const inactive = users.filter(u => !u.isActive).length;
    const admins = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;

    const activePercent = Math.round((active / total) * 100);
    const inactivePercent = Math.round((inactive / total) * 100);
    const adminPercent = Math.round((admins / total) * 100);

    document.getElementById('activeDistribution').style.width = activePercent + '%';
    document.getElementById('inactiveDistribution').style.width = inactivePercent + '%';
    document.getElementById('adminDistribution').style.width = adminPercent + '%';

    document.getElementById('activePercent').textContent = activePercent + '%';
    document.getElementById('inactivePercent').textContent = inactivePercent + '%';
    document.getElementById('adminPercent').textContent = adminPercent + '%';
}

/**
 * Actualiza las métricas de engagement
 */
function updateMetrics(users, battles, goals, diaries) {
    const totalUsers = users.length || 1;
    const activeUsers = users.filter(u => u.isActive).length;
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const completedBattles = battles.filter(b => b.isCompleted).length;

    // Tasa de retención
    const retentionRate = Math.round((activeUsers / totalUsers) * 100);
    document.getElementById('retentionRate').textContent = retentionRate + '%';

    // Completitud de metas
    const totalGoals = goals.length || 1;
    const goalCompletionRate = Math.round((completedGoals / totalGoals) * 100);
    document.getElementById('goalCompletionRate').textContent = goalCompletionRate + '%';

    // Éxito en batallas
    const totalBattles = battles.length || 1;
    const battleSuccessRate = Math.round((completedBattles / totalBattles) * 100);
    document.getElementById('battleSuccessRate').textContent = battleSuccessRate + '%';

    // Promedio de entradas de diario por usuario
    const avgDiary = totalUsers > 0 ? (diaries.length / totalUsers).toFixed(1) : '0';
    document.getElementById('avgDiaryEntries').textContent = avgDiary;
}

/**
 * Actualiza la actividad reciente
 */
function updateRecentActivity(users, battles, goals, diaries) {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    // Crear lista de actividades combinadas
    const activities = [];

    // Nuevos usuarios
    users.forEach(user => {
        if (user.createdAt) {
            activities.push({
                type: 'user',
                title: 'Nuevo usuario registrado',
                desc: `${user.fullName} se unió a la Vanguardia`,
                time: new Date(user.createdAt),
                icon: 'fa-user-plus'
            });
        }
    });

    // Batallas completadas
    battles.forEach(battle => {
        if (battle.isCompleted && battle.completedAt) {
            activities.push({
                type: 'battle',
                title: 'Batalla completada',
                desc: `${battle.name} fue completada`,
                time: new Date(battle.completedAt),
                icon: 'fa-trophy'
            });
        }
    });

    // Metas completadas
    goals.forEach(goal => {
        if (goal.isCompleted && goal.completedAt) {
            activities.push({
                type: 'goal',
                title: 'Meta completada',
                desc: `${goal.title} fue completada`,
                time: new Date(goal.completedAt),
                icon: 'fa-check-circle'
            });
        }
    });

    // Entradas de diario
    diaries.forEach(diary => {
        if (diary.createdAt) {
            activities.push({
                type: 'diary',
                title: 'Nueva entrada de diario',
                desc: `${diary.title || 'Entrada sin título'}`,
                time: new Date(diary.createdAt),
                icon: 'fa-book'
            });
        }
    });

    // Ordenar por tiempo (más reciente primero)
    activities.sort((a, b) => b.time - a.time);

    // Tomar las 10 más recientes
    const recent = activities.slice(0, 10);

    if (recent.length === 0) {
        container.innerHTML = `
            <div class="admin-stats-recent-item empty">
                <i class="fas fa-inbox"></i>
                <span>No hay actividad reciente en el sistema</span>
            </div>
        `;
        return;
    }

    container.innerHTML = recent.map(activity => {
        const timeAgo = getTimeAgo(activity.time);
        return `
            <div class="admin-stats-recent-item">
                <div class="recent-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="recent-info">
                    <div class="recent-title">${activity.title}</div>
                    <div class="recent-desc">${activity.desc}</div>
                </div>
                <span class="recent-time">${timeAgo}</span>
            </div>
        `;
    }).join('');
}

/**
 * Calcula el tiempo transcurrido
 */
function getTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'hace unos segundos';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} horas`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
    return date.toLocaleDateString('es-ES');
}

/**
 * Actualiza la hora de última actualización
 */
function updateLastUpdateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdateTime').textContent = `Última actualización: ${timeStr}`;
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Botón de actualizar
    const refreshBtn = document.getElementById('refreshStatsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CARGANDO...';
            await loadStatsData();
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ACTUALIZAR';
            refreshBtn.disabled = false;
        });
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
            popup: 'tyr-popup',
            title: 'tyr-title',
            htmlContainer: 'tyr-html'
        }
    });
}