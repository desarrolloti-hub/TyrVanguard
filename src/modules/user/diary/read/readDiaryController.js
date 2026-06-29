/* ========================================
   readDiaryController.js
   Controlador CRUD para el Diario del Guerrero (Vista de Lista)
   ======================================== */

import { DiaryService, DIARY_TAGS } from '../../../../services/diaryService.js';

export function readDiaryController() {
    console.log('Inicializando Diario del Guerrero (Lista)...');

    // --- 1. Estado ---
    let entries = [];
    let currentPage = 1;
    const entriesPerPage = 5;
    let filteredEntries = [];
    let currentFilter = 'all';
    let searchTerm = '';
    let userId = null;

    // --- 2. DOM References ---
    const tableBody = document.getElementById('diaryTableBody');
    const emptyState = document.getElementById('diaryEmpty');
    const entryCount = document.getElementById('entryCount');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const searchInput = document.getElementById('searchDiary');
    const filterSelect = document.getElementById('filterTag');
    const newEntryBtn = document.getElementById('newDiaryEntryBtn');
    const emptyNewEntryBtn = document.getElementById('emptyNewEntryBtn');

    // --- 3. Mapeo de etiquetas (Inglés -> Español) ---
    const tagMap = {
        'victory': 'Victoria',
        'learning': 'Aprendizaje',
        'battle': 'Batalla',
        'reflection': 'Reflexion',
        'achievement': 'Logro'
    };

    const tagClassMap = {
        'victory': 'tag-victoria',
        'learning': 'tag-aprendizaje',
        'battle': 'tag-batalla',
        'reflection': 'tag-reflexion',
        'achievement': 'tag-logro'
    };

    // --- 4. Cargar datos desde Firestore ---
    async function loadEntries() {
        try {
            const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
            if (!session || !session.id) {
                console.warn('Usuario no autenticado');
                return;
            }
            
            userId = session.id;
            console.log('Cargando entradas para usuario:', userId);
            
            const entryList = await DiaryService.getUserEntries(userId);
            entries = entryList;
            
            console.log(entries.length + ' entradas cargadas');
            render();
        } catch (error) {
            console.error('Error cargando entradas:', error);
            showToast('Error al cargar las entradas', 'error');
        }
    }

    // --- 5. Render ---
    function render() {
        filteredEntries = entries.filter(entry => {
            const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  entry.content.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTag = currentFilter === 'all' || entry.tag === currentFilter;
            return matchesSearch && matchesTag;
        });

        if (entryCount) {
            entryCount.textContent = filteredEntries.length;
        }

        const totalPages = Math.ceil(filteredEntries.length / entriesPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * entriesPerPage;
        const end = start + entriesPerPage;
        const pageEntries = filteredEntries.slice(start, end);

        if (filteredEntries.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'flex';
                emptyState.classList.add('visible');
            }
            if (tableBody) tableBody.innerHTML = '';
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
                emptyState.classList.remove('visible');
            }
            renderTableRows(pageEntries);
        }

        if (paginationInfo) {
            paginationInfo.textContent = 'Pagina ' + currentPage + ' de ' + totalPages;
        }
        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage <= 1;
        }
        if (nextPageBtn) {
            nextPageBtn.disabled = currentPage >= totalPages;
        }
    }

    function renderTableRows(entriesToRender) {
        if (!tableBody) return;

        if (entriesToRender.length === 0) {
            tableBody.innerHTML = '';
            return;
        }

        tableBody.innerHTML = entriesToRender.map(entry => `
            <tr class="diary-row" data-id="${entry.id}">
                <td data-label="Fecha">${escapeHtml(entry.formattedDate)}</td>
                <td data-label="Titulo">${escapeHtml(entry.title)}</td>
                <td data-label="Entrada">${escapeHtml(entry.preview)}</td>
                <td data-label="Etiqueta">
                    <span class="tag ${tagClassMap[entry.tag] || 'tag-reflexion'}">${tagMap[entry.tag] || entry.tag}</span>
                </td>
                <td data-label="Acciones" class="actions-cell">
                    <button class="btn btn-sm btn-ghost view-entry" title="Ver" data-id="${entry.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-ghost edit-entry" title="Editar" data-id="${entry.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-ghost delete-entry" title="Eliminar" data-id="${entry.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- 6. CRUD Operations con Servicio ---
    async function viewEntry(id) {
        const entry = entries.find(e => e.id === id);
        if (entry) {
            Swal.fire({
                title: entry.title,
                html: `
                    <div style="text-align: left; color: var(--text-secondary);">
                        <p style="margin-bottom: 8px;">
                            <strong style="color: var(--text-primary);">Fecha:</strong> ${entry.formattedDateTime}
                        </p>
                        <p style="margin-bottom: 12px;">
                            <strong style="color: var(--text-primary);">Etiqueta:</strong> 
                            <span class="tag ${tagClassMap[entry.tag] || 'tag-reflexion'}">${tagMap[entry.tag] || entry.tag}</span>
                        </p>
                        <div style="border-top: 1px solid var(--border-tertiary); padding-top: 12px;">
                            <p style="font-style: italic; line-height: 1.6; color: var(--text-primary);">
                                "${escapeHtml(entry.content)}"
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Cerrar',
                customClass: {
                    popup: 'tyr-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm',
                    closeButton: 'tyr-close-btn'
                }
            });
        }
    }

    async function deleteEntry(id) {
        const result = await Swal.fire({
            title: 'Eliminar entrada',
            text: 'Estas seguro de eliminar esta entrada del diario? Esta accion no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'tyr-popup',
                title: 'tyr-title',
                htmlContainer: 'tyr-html',
                confirmButton: 'tyr-btn-danger',
                cancelButton: 'tyr-btn-cancel',
                actions: 'tyr-actions',
                closeButton: 'tyr-close-btn'
            }
        });

        if (result.isConfirmed) {
            try {
                await DiaryService.deleteEntry(id);
                entries = entries.filter(e => e.id !== id);
                render();
                showToast('Entrada eliminada correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar entrada:', error);
                showToast(error.message || 'Error al eliminar la entrada', 'error');
            }
        }
    }

    // --- 7. Modal de Edición ---
    async function openEditModal(entryData) {
        const result = await Swal.fire({
            title: 'Editar Entrada',
            html: `
                <div class="form" style="text-align: left;">
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-tag label-icon"></i>
                            TITULO
                        </label>
                        <input type="text" class="form-input" id="editEntryTitle" value="${escapeHtml(entryData.title)}" placeholder="Ej: Victoria Matutina" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-tag label-icon"></i>
                            ETIQUETA
                        </label>
                        <select class="form-select" id="editEntryTag">
                            <option value="victory" ${entryData.tag === 'victory' ? 'selected' : ''}>Victoria</option>
                            <option value="learning" ${entryData.tag === 'learning' ? 'selected' : ''}>Aprendizaje</option>
                            <option value="battle" ${entryData.tag === 'battle' ? 'selected' : ''}>Batalla</option>
                            <option value="reflection" ${entryData.tag === 'reflection' ? 'selected' : ''}>Reflexion</option>
                            <option value="achievement" ${entryData.tag === 'achievement' ? 'selected' : ''}>Logro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-feather-alt label-icon"></i>
                            ENTRADA
                        </label>
                        <textarea class="form-textarea" id="editEntryContent" rows="5" placeholder="Escribe tu experiencia...">${escapeHtml(entryData.content)}</textarea>
                    </div>
                </div>
            `,
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            showCancelButton: true,
            customClass: {
                popup: 'tyr-popup',
                title: 'tyr-title',
                htmlContainer: 'tyr-html',
                confirmButton: 'tyr-btn-confirm',
                cancelButton: 'tyr-btn-cancel',
                actions: 'tyr-actions',
                closeButton: 'tyr-close-btn'
            },
            preConfirm: () => {
                const titleInput = document.getElementById('editEntryTitle');
                const contentInput = document.getElementById('editEntryContent');
                const tagInput = document.getElementById('editEntryTag');

                const title = titleInput?.value.trim();
                const content = contentInput?.value.trim();
                const tag = tagInput?.value;

                if (!title) {
                    Swal.showValidationMessage('El titulo es obligatorio');
                    return false;
                }
                if (!content) {
                    Swal.showValidationMessage('La entrada no puede estar vacia');
                    return false;
                }

                return { title, content, tag };
            }
        });

        if (result.isConfirmed && result.value) {
            try {
                const { title, content, tag } = result.value;
                const updatedEntry = await DiaryService.updateEntry(entryData.id, { title, content, tag });
                
                const index = entries.findIndex(e => e.id === entryData.id);
                if (index !== -1) {
                    entries[index] = updatedEntry;
                }
                
                render();
                showToast('Entrada actualizada correctamente', 'success');
            } catch (error) {
                console.error('Error al actualizar entrada:', error);
                showToast(error.message || 'Error al actualizar la entrada', 'error');
            }
        }
    }

    // --- 8. Toast ---
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

    // --- 9. Navegación ---
    function navigateToCreate() {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('/crearDiario');
        } else {
            window.location.href = '/crearDiario';
        }
    }

    // --- 10. Event Listeners ---
    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', navigateToCreate);
    }
    if (emptyNewEntryBtn) {
        emptyNewEntryBtn.addEventListener('click', navigateToCreate);
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            currentPage = 1;
            render();
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            currentPage = 1;
            render();
        });
    }

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
            const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                render();
            }
        });
    }

    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const row = btn.closest('.diary-row');
            if (!row) return;

            const id = row.dataset.id;

            if (btn.classList.contains('view-entry')) {
                viewEntry(id);
            } else if (btn.classList.contains('edit-entry')) {
                const entry = entries.find(e => e.id === id);
                if (entry) openEditModal(entry);
            } else if (btn.classList.contains('delete-entry')) {
                deleteEntry(id);
            }
        });
    }

    // --- 11. Escuchar evento de entrada creada ---
    document.addEventListener('diary:created', (e) => {
        const newEntry = e.detail;
        if (newEntry) {
            loadEntries();
            showToast('Nueva entrada creada', 'success');
        }
    });

    // --- 12. Inicializar ---
    loadEntries();
    console.log('Diario del Guerrero (Lista) inicializado correctamente');
}