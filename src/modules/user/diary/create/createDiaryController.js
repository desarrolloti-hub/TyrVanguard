/* ========================================
   diaryController.js
   Controlador CRUD para el Diario del Guerrero
   ======================================== */

export function diaryController() {
    console.log('📖 Inicializando Diario del Guerrero...');

    // --- 1. Estado ---
    let entries = [
        {
            id: 1,
            date: '25 de Junio, 2026',
            title: 'Victoria Matutina',
            content: '"Hoy sentí el impulso, pero recordé mi misión. Salí a correr y la batalla fue ganada. Un día más en la vanguardia."',
            tag: 'victoria'
        },
        {
            id: 2,
            date: '24 de Junio, 2026',
            title: 'Lección del Día',
            content: '"Aprendí que la paciencia es tan importante como la fuerza. No todas las batallas se ganan con el puño."',
            tag: 'aprendizaje'
        }
    ];

    let currentPage = 1;
    const entriesPerPage = 5;
    let filteredEntries = [...entries];
    let currentFilter = 'all';
    let searchTerm = '';

    // --- 2. DOM References ---
    const tableBody = document.getElementById('diaryTableBody');
    const emptyState = document.getElementById('diaryEmpty');
    const entryCount = document.getElementById('entryCount');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const searchInput = document.getElementById('searchDiary');
    const filterSelect = document.getElementById('filterTag');

    // --- 3. Render ---
    function render() {
        // Aplicar filtros
        filteredEntries = entries.filter(entry => {
            const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  entry.content.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTag = currentFilter === 'all' || entry.tag === currentFilter;
            return matchesSearch && matchesTag;
        });

        // Actualizar contador
        if (entryCount) {
            entryCount.textContent = filteredEntries.length;
        }

        // Paginación
        const totalPages = Math.ceil(filteredEntries.length / entriesPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * entriesPerPage;
        const end = start + entriesPerPage;
        const pageEntries = filteredEntries.slice(start, end);

        // Mostrar/ocultar estado vacío
        if (filteredEntries.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            if (tableBody) tableBody.innerHTML = '';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            renderTableRows(pageEntries);
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

    function renderTableRows(entriesToRender) {
        if (!tableBody) return;

        if (entriesToRender.length === 0) {
            tableBody.innerHTML = '';
            return;
        }

        const tagMap = {
            victoria: '🏆 Victoria',
            aprendizaje: '📖 Aprendizaje',
            batalla: '⚔️ Batalla',
            reflexion: '🧠 Reflexión',
            logro: '⭐ Logro'
        };

        tableBody.innerHTML = entriesToRender.map(entry => `
            <tr class="diary-row" data-id="${entry.id}">
                <td data-label="Fecha">${entry.date}</td>
                <td data-label="Título">${escapeHtml(entry.title)}</td>
                <td data-label="Entrada">${escapeHtml(entry.content)}</td>
                <td data-label="Etiqueta">
                    <span class="tag tag-${entry.tag}">${tagMap[entry.tag] || entry.tag}</span>
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

    // Helper para escapar HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- 4. CRUD Operations ---

    // Crear
    function createEntry(title, content, tag) {
        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            title: title.trim(),
            content: content.trim(),
            tag: tag || 'reflexion'
        };
        entries.unshift(newEntry);
        render();
        showToast('✅ Nueva entrada creada con éxito');
    }

    // Leer (Ver)
    function viewEntry(id) {
        const entry = entries.find(e => e.id === id);
        if (entry) {
            const tagMap = {
                victoria: '🏆 Victoria',
                aprendizaje: '📖 Aprendizaje',
                batalla: '⚔️ Batalla',
                reflexion: '🧠 Reflexión',
                logro: '⭐ Logro'
            };
            alert(`📖 ${entry.title}\n\n📅 ${entry.date}\n🏷️ ${tagMap[entry.tag] || entry.tag}\n\n${entry.content}`);
        }
    }

    // Actualizar
    function updateEntry(id, title, content, tag) {
        const entry = entries.find(e => e.id === id);
        if (entry) {
            entry.title = title.trim();
            entry.content = content.trim();
            entry.tag = tag || entry.tag;
            render();
            showToast('✏️ Entrada actualizada correctamente');
        }
    }

    // Eliminar
    function deleteEntry(id) {
        if (confirm('⚔️ ¿Estás seguro de eliminar esta entrada del diario?')) {
            entries = entries.filter(e => e.id !== id);
            render();
            showToast('🗑️ Entrada eliminada');
        }
    }

    // --- 5. Modal de creación/edición ---
    function openEntryModal(entryData = null) {
        const isEdit = !!entryData;
        const title = isEdit ? entryData.title : '';
        const content = isEdit ? entryData.content : '';
        const tag = isEdit ? entryData.tag : 'reflexion';

        // Crear modal con SweetAlert2
        Swal.fire({
            title: isEdit ? '✏️ Editar Entrada' : '📝 Nueva Entrada',
            html: `
                <div class="form" style="text-align: left;">
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-tag label-icon"></i>
                            TÍTULO
                        </label>
                        <input type="text" class="form-input" id="entryTitle" value="${escapeHtml(title)}" placeholder="Ej: Victoria Matutina" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-tag label-icon"></i>
                            ETIQUETA
                        </label>
                        <select class="form-select" id="entryTag">
                            <option value="victoria" ${tag === 'victoria' ? 'selected' : ''}>🏆 Victoria</option>
                            <option value="aprendizaje" ${tag === 'aprendizaje' ? 'selected' : ''}>📖 Aprendizaje</option>
                            <option value="batalla" ${tag === 'batalla' ? 'selected' : ''}>⚔️ Batalla</option>
                            <option value="reflexion" ${tag === 'reflexion' ? 'selected' : ''}>🧠 Reflexión</option>
                            <option value="logro" ${tag === 'logro' ? 'selected' : ''}>⭐ Logro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-feather-alt label-icon"></i>
                            ENTRADA
                        </label>
                        <textarea class="form-textarea" id="entryContent" rows="5" placeholder="Escribe tu experiencia...">${escapeHtml(content)}</textarea>
                    </div>
                </div>
            `,
            confirmButtonText: isEdit ? '✏️ ACTUALIZAR' : '📝 GUARDAR',
            cancelButtonText: 'CANCELAR',
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
                const titleInput = document.getElementById('entryTitle');
                const contentInput = document.getElementById('entryContent');
                const tagInput = document.getElementById('entryTag');

                const title = titleInput?.value.trim();
                const content = contentInput?.value.trim();
                const tag = tagInput?.value;

                if (!title) {
                    Swal.showValidationMessage('El título es obligatorio');
                    return false;
                }
                if (!content) {
                    Swal.showValidationMessage('La entrada no puede estar vacía');
                    return false;
                }

                return { title, content, tag };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const { title, content, tag } = result.value;
                if (isEdit) {
                    updateEntry(entryData.id, title, content, tag);
                } else {
                    createEntry(title, content, tag);
                }
            }
        });
    }

    // --- 6. Toast notifications ---
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

    // --- 7. Event Listeners ---

    // Botón Nueva Entrada
    const newEntryBtn = document.getElementById('newDiaryEntryBtn');
    const emptyNewEntryBtn = document.getElementById('emptyNewEntryBtn');
    
    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', () => openEntryModal());
    }
    if (emptyNewEntryBtn) {
        emptyNewEntryBtn.addEventListener('click', () => openEntryModal());
    }

    // Búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            currentPage = 1;
            render();
        });
    }

    // Filtro
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
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
            const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
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

            const row = btn.closest('.diary-row');
            if (!row) return;

            const id = parseInt(row.dataset.id);

            if (btn.classList.contains('view-entry')) {
                viewEntry(id);
            } else if (btn.classList.contains('edit-entry')) {
                const entry = entries.find(e => e.id === id);
                if (entry) openEntryModal(entry);
            } else if (btn.classList.contains('delete-entry')) {
                deleteEntry(id);
            }
        });
    }

    // --- 8. Inicializar ---
    render();
    console.log('✅ Diario del Guerrero inicializado correctamente');
}