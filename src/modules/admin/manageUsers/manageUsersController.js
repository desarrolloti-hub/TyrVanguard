/* ========================================
   MANAGE USERS CONTROLLER - Gestión de usuarios
   Solo controla UI, eventos y llamadas a servicios
   ======================================== */

import { AdminService } from '../../../services/adminService.js';
import { UserService } from '../../../services/userService.js';

// Estado local
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const USERS_PER_PAGE = 8;
let currentFilters = { search: '', role: 'all', status: 'all' };

export async function manageUsersController() {
    console.log('👥 Manage Users Controller inicializado');

    // Verificar autenticación
    if (!AdminService.isAuthenticated()) {
        console.warn('🔒 No autenticado, redirigiendo...');
        window.location.href = '/iniciarSesion';
        return;
    }

    // Cargar datos
    await loadUsers();

    // Configurar event listeners
    setupEventListeners();
}

/**
 * Carga usuarios desde el servicio
 */
async function loadUsers() {
    try {
        console.log('📥 Cargando usuarios...');

        allUsers = await UserService.getUsers();
        
        // Ordenar por fecha de creación (más reciente primero)
        allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        applyFilters();
        renderTable();

        console.log(`✅ ${allUsers.length} usuarios cargados`);

    } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
        showToast('error', 'Error al cargar los usuarios');
    }
}

/**
 * Aplica filtros a la lista de usuarios
 */
function applyFilters() {
    const { search, role, status } = currentFilters;
    const searchLower = search.toLowerCase().trim();

    filteredUsers = allUsers.filter(user => {
        // Filtro por búsqueda
        if (searchLower) {
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            const email = user.email.toLowerCase();
            const roleStr = user.role?.toLowerCase() || '';
            
            if (!fullName.includes(searchLower) && 
                !email.includes(searchLower) && 
                !roleStr.includes(searchLower)) {
                return false;
            }
        }

        // Filtro por rol
        if (role !== 'all' && user.role !== role) {
            return false;
        }

        // Filtro por estado
        if (status === 'active' && !user.isActive) return false;
        if (status === 'inactive' && user.isActive) return false;

        return true;
    });

    currentPage = 1;
}

/**
 * Renderiza la tabla de usuarios
 */
function renderTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const start = (currentPage - 1) * USERS_PER_PAGE;
    const end = start + USERS_PER_PAGE;
    const pageUsers = filteredUsers.slice(start, end);

    if (pageUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px 20px;color:var(--text-muted);">
                    <i class="fas fa-users" style="font-size:32px;opacity:0.2;display:block;margin-bottom:12px;"></i>
                    ${allUsers.length === 0 ? 'No hay usuarios registrados en el sistema' : 'No se encontraron usuarios con los filtros aplicados'}
                </td>
            </tr>
        `;
        updatePagination();
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
                    <div>
                        <div class="admin-user-name">${user.fullName}</div>
                        <span class="admin-user-email-small">${user.email}</span>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="admin-role-badge ${user.role || 'user'}">
                    ${getRoleLabel(user.role)}
                </span>
            </td>
            <td>
                <span class="admin-plan-badge ${user.plan || 'free'}">
                    ${getPlanLabel(user.plan)}
                </span>
            </td>
            <td>
                <span class="admin-status-badge ${user.isActive ? 'active' : 'inactive'}">
                    <i class="fas fa-circle"></i>
                    ${user.isActive ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <span class="admin-verified-badge ${user.emailVerified ? 'verified' : 'unverified'}">
                    <i class="fas ${user.emailVerified ? 'fa-check-circle' : 'fa-clock'}"></i>
                    ${user.emailVerified ? 'Verificado' : 'Pendiente'}
                </span>
            </td>
            <td>
                <div class="admin-actions-group">
                    <button class="admin-action-btn view" data-userid="${user.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="admin-action-btn toggle" data-userid="${user.id}" title="${user.isActive ? 'Desactivar' : 'Activar'}">
                        <i class="fas ${user.isActive ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    </button>
                    <button class="admin-action-btn delete" data-userid="${user.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    updatePagination();

    // Event listeners a los botones de acción
    document.querySelectorAll('.admin-action-btn.view').forEach(btn => {
        btn.addEventListener('click', () => handleViewUser(btn.dataset.userid));
    });

    document.querySelectorAll('.admin-action-btn.toggle').forEach(btn => {
        btn.addEventListener('click', () => handleToggleUser(btn.dataset.userid));
    });

    document.querySelectorAll('.admin-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteUser(btn.dataset.userid));
    });
}

/**
 * Actualiza la paginación
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const tableInfo = document.getElementById('usersTableInfo');

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`;
    
    if (tableInfo) {
        const start = (currentPage - 1) * USERS_PER_PAGE + 1;
        const end = Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length);
        tableInfo.textContent = `Mostrando ${start} - ${end} de ${filteredUsers.length} usuarios${allUsers.length !== filteredUsers.length ? ` (${allUsers.length} total)` : ''}`;
    }
}

/**
 * Obtiene etiqueta del rol
 */
function getRoleLabel(role) {
    const labels = {
        super_admin: 'Super Admin',
        admin: 'Admin',
        user: 'Usuario',
        guest: 'Invitado'
    };
    return labels[role] || role || 'Usuario';
}

/**
 * Obtiene etiqueta del plan
 */
function getPlanLabel(plan) {
    const labels = {
        free: 'Gratis',
        basic: 'Básico',
        premium: 'Premium',
        enterprise: 'Empresa'
    };
    return labels[plan] || plan || 'Gratis';
}

/**
 * Maneja la visualización de un usuario (Modal)
 */
async function handleViewUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showToast('error', 'Usuario no encontrado');
        return;
    }

    if (typeof Swal === 'undefined') {
        alert(`Usuario: ${user.fullName}\nEmail: ${user.email}\nRol: ${getRoleLabel(user.role)}\nEstado: ${user.isActive ? 'Activo' : 'Inactivo'}`);
        return;
    }

    const roleLabel = getRoleLabel(user.role);
    const planLabel = getPlanLabel(user.plan);
    const statusLabel = user.isActive ? 'Activo' : 'Inactivo';
    const statusClass = user.isActive ? 'status-active' : 'status-inactive';
    const verifiedLabel = user.emailVerified ? 'Verificado' : 'Pendiente';
    const verifiedClass = user.emailVerified ? 'verified' : 'unverified';
    const roleClass = user.role === 'admin' || user.role === 'super_admin' ? 'role-admin' : 'role-user';

    const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'N/A';
    
    const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Nunca';

    const avatarUrl = user.photoURL || '/assets/img/default-avatar.png';

  // En handleViewUser - el HTML del modal
Swal.fire({
    title: `<i class="fas fa-user-shield"></i> ${user.fullName}`,
    html: `
        <div class="user-preview-content">
            <img class="user-preview-avatar" src="${avatarUrl}" alt="${user.fullName}" onerror="this.src='/assets/img/default-avatar.png'" />
            <div class="user-preview-info">
                <div class="info-item full-width">
                    <span class="label"><i class="fas fa-envelope"></i> Correo</span>
                    <span class="value">${user.email}</span>
                </div>
                <div class="info-item">
                    <span class="label"><i class="fas fa-user-tag"></i> Rol</span>
                    <span class="value ${roleClass}">${roleLabel}</span>
                </div>
                <div class="info-item">
                    <span class="label"><i class="fas fa-crown"></i> Plan</span>
                    <span class="value">${planLabel}</span>
                </div>
                <div class="info-item">
                    <span class="label"><i class="fas fa-circle"></i> Estado</span>
                    <span class="value ${statusClass}">${statusLabel}</span>
                </div>
                <div class="info-item">
                    <span class="label"><i class="fas fa-check-circle"></i> Verificado</span>
                    <span class="value ${verifiedClass}">${verifiedLabel}</span>
                </div>
                <div class="info-item full-width">
                    <span class="label"><i class="fas fa-calendar-alt"></i> Registrado</span>
                    <span class="value" style="font-size:var(--font-size-xs);">${createdAt}</span>
                </div>
                <div class="info-item full-width">
                    <span class="label"><i class="fas fa-clock"></i> Último acceso</span>
                    <span class="value" style="font-size:var(--font-size-xs);">${lastLogin}</span>
                </div>
            </div>
        </div>
    `,
    showCloseButton: true,
    focusConfirm: false,
    confirmButtonText: 'CERRAR',
    customClass: {
        popup: 'tyr-popup tyr-user-preview',
        title: 'tyr-title',
        htmlContainer: 'tyr-html',
        confirmButton: 'tyr-btn-confirm',
        closeButton: 'tyr-close-btn'
    }
});
}

/**
 * Maneja activar/desactivar usuario
 */
async function handleToggleUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const action = user.isActive ? 'desactivar' : 'activar';
    const actionText = user.isActive ? 'DESACTIVAR' : 'ACTIVAR';
    const icon = user.isActive ? 'warning' : 'info';
    const statusText = user.isActive ? 'inactiva' : 'activa';

    if (typeof Swal === 'undefined') {
        if (confirm(`¿${actionText} a ${user.fullName}?`)) {
            try {
                await UserService.updateProfile(userId, { isActive: !user.isActive });
                showToast('success', `Usuario ${user.isActive ? 'desactivado' : 'activado'} correctamente`);
                await loadUsers();
            } catch (error) {
                showToast('error', error.message || 'Error al cambiar estado');
            }
        }
        return;
    }

    const confirm = await Swal.fire({
        title: `¿${actionText} guerrero?`,
        html: `
            <p>Estás a punto de <strong>${action}</strong> a <strong>${user.fullName}</strong></p>
            <p style="font-size:0.9rem;color:var(--text-muted);">Su cuenta quedará ${statusText} en el sistema</p>
        `,
        icon: icon,
        showCancelButton: true,
        confirmButtonText: actionText,
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'tyr-popup',
            title: 'tyr-title',
            htmlContainer: 'tyr-html',
            confirmButton: user.isActive ? 'tyr-btn-confirm' : 'tyr-btn-confirm',
            cancelButton: 'tyr-btn-cancel'
        }
    });

    if (confirm.isConfirmed) {
        try {
            await UserService.updateProfile(userId, { isActive: !user.isActive });
            showToast('success', `Usuario ${user.isActive ? 'desactivado' : 'activado'} correctamente`);
            await loadUsers();
        } catch (error) {
            showToast('error', error.message || 'Error al cambiar estado');
        }
    }
}

/**
 * Maneja la eliminación de un usuario
 */
async function handleDeleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    if (typeof Swal === 'undefined') {
        if (confirm(`¿Eliminar a ${user.fullName}?`)) {
            try {
                await UserService.deleteUser(userId);
                showToast('success', 'Usuario eliminado correctamente');
                await loadUsers();
            } catch (error) {
                showToast('error', error.message || 'Error al eliminar');
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
            await loadUsers();
        } catch (error) {
            showToast('error', error.message || 'Error al eliminar');
        }
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
 * Configura los event listeners
 */
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('usersSearchInput');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                currentFilters.search = searchInput.value;
                applyFilters();
                renderTable();
            }, 300);
        });
    }

    // Filtro de rol
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', () => {
            currentFilters.role = roleFilter.value;
            applyFilters();
            renderTable();
        });
    }

    // Filtro de estado
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentFilters.status = statusFilter.value;
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
            const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }

    // Botón de actualizar
    const refreshBtn = document.getElementById('refreshUsersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CARGANDO...';
            await loadUsers();
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ACTUALIZAR';
            refreshBtn.disabled = false;
        });
    }

    // Botón de nuevo usuario
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            if (window.navigateTo) {
                window.navigateTo('/crearCuenta');
            } else {
                window.location.href = '/crearCuenta';
            }
        });
    }
}