/* ========================================
   HOME ADMIN CONTROLLER - Dashboard de administración
   Maneja eventos y UI del panel de admin
   ======================================== */

import { AdminService } from '../../../services/adminService.js';
import { UserService } from '../../../services/userService.js';
import { BattleService } from '../../../services/battleService.js';
import { GoalService } from '../../../services/goalService.js';

// Estado local
let currentUsers = [];
let currentPage = 1;
const USERS_PER_PAGE = 5;
let allUsers = [];

export async function homeAdminController() {
    console.log('⚔️ Home Admin Controller inicializado');

    // Mostrar nombre del admin usando AdminService
    const session = AdminService.getSession();
    const adminNameDisplay = document.getElementById('adminNameDisplay');
    if (adminNameDisplay && session) {
        adminNameDisplay.textContent = session.fullName || 'COMANDANTE';
    }

    // Verificar autenticación
    if (!AdminService.isAuthenticated()) {
        console.warn('🔒 No autenticado, redirigiendo...');
        window.location.href = '/iniciarSesion';
        return;
    }

    // Cargar datos iniciales
    await loadDashboardData();

    // Event listeners
    setupEventListeners();
}

/**
 * Carga todos los datos del dashboard
 */
async function loadDashboardData() {
    try {
        console.log('📊 Cargando datos del dashboard...');
        
        // Mostrar loading
        showLoadingState();

        // Cargar usuarios
        allUsers = await UserService.getUsers();
        
        // Cargar estadísticas de batallas y metas
        const [battleStats, goalStats] = await Promise.all([
            getAllBattlesStats(),
            getAllGoalsStats()
        ]);

        // Actualizar estadísticas
        updateStats(allUsers, battleStats, goalStats);

        // Renderizar tabla de usuarios
        renderUsersTable(allUsers);

        // Actualizar info de sistema
        updateSystemInfo(allUsers.length);

        console.log('✅ Dashboard cargado correctamente');

    } catch (error) {
        console.error('❌ Error cargando dashboard:', error);
        showError('Error al cargar los datos del dashboard');
    }
}

/**
 * Obtiene estadísticas de todas las batallas
 */
async function getAllBattlesStats() {
    try {
        // Obtenemos todas las batallas de todos los usuarios
        const users = await UserService.getUsers();
        let totalBattles = 0;
        let completedBattles = 0;

        for (const user of users) {
            try {
                const battles = await BattleService.getUserBattles(user.id);
                totalBattles += battles.length;
                completedBattles += battles.filter(b => b.isCompleted).length;
            } catch (e) {
                // Usuario sin batallas
            }
        }

        return { total: totalBattles, completed: completedBattles };
    } catch (error) {
        console.error('Error obteniendo estadísticas de batallas:', error);
        return { total: 0, completed: 0 };
    }
}

/**
 * Obtiene estadísticas de todas las metas
 */
async function getAllGoalsStats() {
    try {
        const users = await UserService.getUsers();
        let totalGoals = 0;
        let completedGoals = 0;

        for (const user of users) {
            try {
                const goals = await GoalService.getUserGoals(user.id);
                totalGoals += goals.length;
                completedGoals += goals.filter(g => g.isCompleted).length;
            } catch (e) {
                // Usuario sin metas
            }
        }

        return { total: totalGoals, completed: completedGoals };
    } catch (error) {
        console.error('Error obteniendo estadísticas de metas:', error);
        return { total: 0, completed: 0 };
    }
}

/**
 * Actualiza las tarjetas de estadísticas
 */
function updateStats(users, battleStats, goalStats) {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;

    const totalUsersEl = document.getElementById('totalUsers');
    const activeUsersEl = document.getElementById('activeUsers');
    const totalBattlesEl = document.getElementById('totalBattles');
    const completedGoalsEl = document.getElementById('completedGoals');

    if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    if (activeUsersEl) activeUsersEl.textContent = activeUsers;
    if (totalBattlesEl) totalBattlesEl.textContent = battleStats.total || 0;
    if (completedGoalsEl) completedGoalsEl.textContent = goalStats.completed || 0;
}

/**
 * Renderiza la tabla de usuarios
 */
function renderUsersTable(users, page = 1) {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    const start = (page - 1) * USERS_PER_PAGE;
    const end = start + USERS_PER_PAGE;
    const pageUsers = users.slice(start, end);

    if (pageUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">
                    <i class="fas fa-users" style="font-size:24px;opacity:0.3;display:block;margin-bottom:10px;"></i>
                    No hay usuarios registrados
                </td>
            </tr>
        `;
        updatePagination(users.length, page);
        return;
    }

    tbody.innerHTML = pageUsers.map(user => `
        <tr>
            <td>
                <div class="admin-user-cell">
                    <img class="admin-user-avatar" 
                         src="${user.photoURL || '/assets/img/default-avatar.png'}" 
                         alt="${user.fullName}"
                         onerror="this.src='/assets/img/default-avatar.png'"
                    />
                    <span class="admin-user-name">${user.fullName}</span>
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="admin-status-badge ${user.isActive ? 'active' : 'inactive'}">
                    <i class="fas fa-circle"></i>
                    ${user.isActive ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <span class="admin-role-badge ${user.role === 'admin' || user.role === 'super_admin' ? 'admin' : 'user'}">
                    ${user.role === 'admin' || user.role === 'super_admin' ? 'Admin' : 'Usuario'}
                </span>
            </td>
            <td>${user.battlesCount || 0}</td>
            <td>
                <button class="admin-action-btn edit" data-userid="${user.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="admin-action-btn delete" data-userid="${user.id}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Actualizar paginación
    updatePagination(users.length, page);

    // Agregar event listeners a botones de acción
    document.querySelectorAll('.admin-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', () => handleEditUser(btn.dataset.userid));
    });

    document.querySelectorAll('.admin-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteUser(btn.dataset.userid));
    });
}

/**
 * Actualiza la paginación
 */
function updatePagination(totalItems, currentPage) {
    const totalPages = Math.ceil(totalItems / USERS_PER_PAGE) || 1;
    const prevBtn = document.getElementById('adminPrevPage');
    const nextBtn = document.getElementById('adminNextPage');
    const pageInfo = document.getElementById('adminPageInfo');
    const tableInfo = document.getElementById('usersTableInfo');

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`;
    if (tableInfo) {
        const start = (currentPage - 1) * USERS_PER_PAGE + 1;
        const end = Math.min(currentPage * USERS_PER_PAGE, totalItems);
        tableInfo.textContent = `Mostrando ${start} - ${end} de ${totalItems} usuarios`;
    }
}

/**
 * Actualiza la información del sistema
 */
function updateSystemInfo(totalRecords) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });

    const lastUpdateEl = document.getElementById('lastUpdateTime');
    const totalRecordsEl = document.getElementById('totalRecords');

    if (lastUpdateEl) lastUpdateEl.textContent = timeStr;
    if (totalRecordsEl) totalRecordsEl.textContent = totalRecords;
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Búsqueda de usuarios
    const searchInput = document.getElementById('adminUserSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterUsers(searchInput.value);
            }, 300);
        });
    }

    // Paginación
    const prevBtn = document.getElementById('adminPrevPage');
    const nextBtn = document.getElementById('adminNextPage');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderUsersTable(currentFilteredUsers || allUsers, currentPage);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil((currentFilteredUsers || allUsers).length / USERS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderUsersTable(currentFilteredUsers || allUsers, currentPage);
            }
        });
    }

    // Botón de actualizar
    const refreshBtn = document.getElementById('refreshStatsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CARGANDO...';
            await loadDashboardData();
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ACTUALIZAR';
            refreshBtn.disabled = false;
        });
    }

    // Botón de nuevo usuario
    const addUserBtn = document.getElementById('adminAddUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            // Redirigir a crear cuenta
            if (window.navigateTo) {
                window.navigateTo('/crearCuenta');
            } else {
                window.location.href = '/crearCuenta';
            }
        });
    }
}

// Variable para usuarios filtrados
let currentFilteredUsers = null;

/**
 * Filtra usuarios por búsqueda
 */
function filterUsers(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
        currentFilteredUsers = null;
        currentPage = 1;
        renderUsersTable(allUsers, 1);
        return;
    }

    const filtered = allUsers.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(term) || 
               user.email.toLowerCase().includes(term) ||
               (user.role && user.role.toLowerCase().includes(term));
    });

    currentFilteredUsers = filtered;
    currentPage = 1;
    renderUsersTable(filtered, 1);
}

/**
 * Maneja la edición de un usuario
 */
function handleEditUser(userId) {
    console.log(`✏️ Editar usuario: ${userId}`);
    // Aquí puedes abrir un modal de edición o redirigir
    showToast('info', `Función de edición en desarrollo`);
}

/**
 * Maneja la eliminación de un usuario
 */
async function handleDeleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    // Verificar SweetAlert2
    if (typeof Swal === 'undefined') {
        console.warn('SweetAlert2 no disponible, usando confirm nativo');
        if (confirm(`¿Eliminar a ${user.fullName}?`)) {
            try {
                await UserService.deleteUser(userId);
                showToast('success', 'Usuario eliminado correctamente');
                await loadDashboardData();
            } catch (error) {
                console.error('Error eliminando usuario:', error);
                alert(error.message || 'Error al eliminar el usuario');
            }
        }
        return;
    }

    const confirm = await Swal.fire({
        title: '¿Eliminar guerrero?',
        html: `
            <p>Estás a punto de eliminar a <strong>${user.fullName}</strong></p>
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
        try {
            await UserService.deleteUser(userId);
            showToast('success', 'Usuario eliminado correctamente');
            await loadDashboardData();
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            showToast('error', error.message || 'Error al eliminar el usuario');
        }
    }
}

/**
 * Muestra un estado de carga
 */
function showLoadingState() {
    // No hacemos nada especial por ahora
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    showToast('error', message);
}

/**
 * Muestra un toast con SweetAlert2
 */
function showToast(icon, message) {
    // Verificar SweetAlert2
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