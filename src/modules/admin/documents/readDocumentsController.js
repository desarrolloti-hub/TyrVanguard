/* ========================================
   READ DOCUMENTS ADMIN CONTROLLER
   Gestión de documentos (Admin)
   ======================================== */

// Estado local
let allDocuments = [];
let filteredDocuments = [];
let currentPage = 1;
const DOCUMENTS_PER_PAGE = 8;

export async function initReadDocumentsAdmin() {
    console.log('📄 Read Documents Admin Controller inicializado');

    // Cargar documentos
    await loadDocuments();

    // Configurar event listeners
    setupEventListeners();
}

/**
 * Carga documentos desde el servicio
 */
async function loadDocuments() {
    try {
        console.log('📥 Cargando documentos...');

        // Aquí iría la llamada al servicio
        // allDocuments = await DocumentService.getAllDocuments();
        // Simulamos datos de ejemplo
        allDocuments = getMockDocuments();

        // Ordenar por fecha (más reciente primero)
        allDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        applyFilters();
        renderTable();

        console.log(`✅ ${allDocuments.length} documentos cargados`);

    } catch (error) {
        console.error('❌ Error cargando documentos:', error);
        showToast('error', 'Error al cargar los documentos');
    }
}

/**
 * Aplica filtros a la lista de documentos
 */
function applyFilters() {
    const search = document.getElementById('documentsSearchInput')?.value.toLowerCase().trim() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const visibility = document.getElementById('visibilityFilter')?.value || 'all';
    const type = document.getElementById('typeFilter')?.value || 'all';

    filteredDocuments = allDocuments.filter(doc => {
        // Filtro por búsqueda
        if (search) {
            const title = doc.title.toLowerCase();
            const description = doc.description.toLowerCase();
            const uploader = doc.uploader.toLowerCase();
            if (!title.includes(search) && !description.includes(search) && !uploader.includes(search)) {
                return false;
            }
        }

        // Filtro por categoría
        if (category !== 'all' && doc.category !== category) {
            return false;
        }

        // Filtro por visibilidad
        if (visibility !== 'all' && doc.visibility !== visibility) {
            return false;
        }

        // Filtro por tipo de archivo
        if (type !== 'all') {
            const docType = getFileType(doc.type);
            if (docType !== type) {
                return false;
            }
        }

        return true;
    });

    currentPage = 1;
}

/**
 * Renderiza la tabla de documentos
 */
function renderTable() {
    const tbody = document.getElementById('documentsTableBody');
    if (!tbody) return;

    const start = (currentPage - 1) * DOCUMENTS_PER_PAGE;
    const end = start + DOCUMENTS_PER_PAGE;
    const pageDocs = filteredDocuments.slice(start, end);

    if (pageDocs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px 20px;color:var(--text-muted);">
                    <i class="fas fa-file-alt" style="font-size:32px;opacity:0.2;display:block;margin-bottom:12px;"></i>
                    ${allDocuments.length === 0 ? 'No hay documentos registrados' : 'No se encontraron documentos con los filtros aplicados'}
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }

    tbody.innerHTML = pageDocs.map(doc => `
        <tr>
            <td>
                <div class="manage-doc-cell">
                    <div class="manage-doc-icon ${getFileIcon(doc.type)}">
                        <i class="fas ${getFileIconClass(doc.type)}"></i>
                    </div>
                    <div>
                        <div class="manage-doc-name">${doc.title}</div>
                        <span class="manage-doc-desc-small">${doc.description.substring(0, 50)}${doc.description.length > 50 ? '...' : ''}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="manage-doc-category ${doc.category}">
                    ${getCategoryLabel(doc.category)}
                </span>
            </td>
            <td>
                <span class="manage-doc-format">${doc.type.toUpperCase()}</span>
            </td>
            <td>
                <span class="manage-doc-size">${doc.size}</span>
            </td>
            <td>
                <span class="manage-doc-visibility ${doc.visibility}">
                    ${getVisibilityLabel(doc.visibility)}
                </span>
            </td>
            <td>
                <span class="manage-doc-uploader">
                    <i class="fas fa-user"></i> ${doc.uploader}
                </span>
            </td>
            <td>
                <div class="manage-actions-group">
                    <button class="manage-action-btn view" data-docid="${doc.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="manage-action-btn download" data-docid="${doc.id}" title="Descargar">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="manage-action-btn delete" data-docid="${doc.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    updatePagination();

    // Event listeners a los botones de acción
    document.querySelectorAll('.manage-action-btn.view').forEach(btn => {
        btn.addEventListener('click', () => handleViewDocument(btn.dataset.docid));
    });

    document.querySelectorAll('.manage-action-btn.download').forEach(btn => {
        btn.addEventListener('click', () => handleDownloadDocument(btn.dataset.docid));
    });

    document.querySelectorAll('.manage-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteDocument(btn.dataset.docid));
    });
}

/**
 * Actualiza la paginación
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredDocuments.length / DOCUMENTS_PER_PAGE) || 1;
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const tableInfo = document.getElementById('documentsTableInfo');

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `${currentPage} / ${totalPages}`;
    
    if (tableInfo) {
        const start = (currentPage - 1) * DOCUMENTS_PER_PAGE + 1;
        const end = Math.min(currentPage * DOCUMENTS_PER_PAGE, filteredDocuments.length);
        tableInfo.textContent = `Mostrando ${start} - ${end} de ${filteredDocuments.length} documentos${allDocuments.length !== filteredDocuments.length ? ` (${allDocuments.length} total)` : ''}`;
    }
}

/**
 * Obtiene icono según tipo de archivo
 */
function getFileIcon(type) {
    const icons = {
        pdf: 'pdf',
        doc: 'word',
        docx: 'word',
        txt: 'txt',
        jpg: 'image',
        jpeg: 'image',
        png: 'image'
    };
    return icons[type] || 'other';
}

function getFileIconClass(type) {
    const classes = {
        pdf: 'fa-file-pdf',
        doc: 'fa-file-word',
        docx: 'fa-file-word',
        txt: 'fa-file-alt',
        jpg: 'fa-file-image',
        jpeg: 'fa-file-image',
        png: 'fa-file-image'
    };
    return classes[type] || 'fa-file';
}

function getFileType(type) {
    const types = {
        pdf: 'pdf',
        doc: 'doc',
        docx: 'doc',
        txt: 'txt',
        jpg: 'image',
        jpeg: 'image',
        png: 'image'
    };
    return types[type] || 'other';
}

/**
 * Obtiene etiqueta de categoría
 */
function getCategoryLabel(category) {
    const labels = {
        guia: 'Guías',
        educacion: 'Educación',
        bienestar: 'Bienestar',
        relato: 'Relatos',
        poesia: 'Poesía',
        ensayo: 'Ensayos',
        investigacion: 'Investigación',
        otros: 'Otros'
    };
    return labels[category] || category;
}

/**
 * Obtiene etiqueta de visibilidad
 */
function getVisibilityLabel(visibility) {
    const labels = {
        public: '🌍 Público',
        registered: '🔒 Registrados'
    };
    return labels[visibility] || visibility;
}

/**
 * Maneja la visualización de un documento
 */
async function handleViewDocument(docId) {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) {
        showToast('error', 'Documento no encontrado');
        return;
    }

    if (typeof Swal === 'undefined') {
        showToast('info', `Ver: ${doc.title}`);
        return;
    }

    Swal.fire({
        title: `📄 ${doc.title}`,
        html: `
            <div style="text-align:left;">
                <p style="color:var(--text-muted);font-size:var(--font-size-sm);margin-bottom:12px;">${doc.description}</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--bg-input);padding:12px;border-radius:var(--border-radius-sm);">
                    <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Categoría</span><br><strong>${getCategoryLabel(doc.category)}</strong></div>
                    <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Formato</span><br><strong>${doc.type.toUpperCase()}</strong></div>
                    <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Tamaño</span><br><strong>${doc.size}</strong></div>
                    <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Visibilidad</span><br><strong>${getVisibilityLabel(doc.visibility)}</strong></div>
                    <div style="grid-column:1/-1;"><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Subido por</span><br><strong><i class="fas fa-user"></i> ${doc.uploader}</strong></div>
                    <div style="grid-column:1/-1;"><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Fecha</span><br><strong>${new Date(doc.createdAt).toLocaleDateString('es-ES', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}</strong></div>
                </div>
                ${doc.tags && doc.tags.length > 0 ? `
                    <div style="margin-top:8px;">
                        <span style="color:var(--text-muted);font-size:var(--font-size-xs);">🏷️ Etiquetas:</span>
                        <span style="color:var(--text-secondary);font-size:var(--font-size-xs);">${doc.tags.join(', ')}</span>
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
}

/**
 * Maneja la descarga de un documento
 */
function handleDownloadDocument(docId) {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) {
        showToast('error', 'Documento no encontrado');
        return;
    }

    showToast('info', `⬇️ Descargando: ${doc.title}`);
    // Aquí iría la lógica de descarga
}

/**
 * Maneja la eliminación de un documento
 */
async function handleDeleteDocument(docId) {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) return;

    if (typeof Swal === 'undefined') {
        if (confirm(`¿Eliminar "${doc.title}"?`)) {
            try {
                // await DocumentService.deleteDocument(docId);
                const index = allDocuments.findIndex(d => d.id === docId);
                if (index !== -1) allDocuments.splice(index, 1);
                showToast('success', 'Documento eliminado correctamente');
                applyFilters();
                renderTable();
            } catch (error) {
                showToast('error', error.message || 'Error al eliminar');
            }
        }
        return;
    }

    const confirm = await Swal.fire({
        title: '¿Eliminar documento?',
        html: `
            <p>Estás a punto de eliminar "<strong>${doc.title}</strong>"</p>
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
            // await DocumentService.deleteDocument(docId);
            const index = allDocuments.findIndex(d => d.id === docId);
            if (index !== -1) allDocuments.splice(index, 1);
            showToast('success', 'Documento eliminado correctamente');
            applyFilters();
            renderTable();
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
 * Datos mock para prueba
 */
function getMockDocuments() {
    return [
        {
            id: '1',
            title: 'Guía para Fortalecer la Mente',
            description: 'Técnicas y ejercicios para desarrollar resiliencia mental y emocional',
            category: 'guia',
            type: 'pdf',
            size: '2.4 MB',
            uploader: 'Comandante',
            visibility: 'public',
            tags: ['mental', 'resiliencia', 'crecimiento'],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
        },
        {
            id: '2',
            title: 'El Camino del Guerrero Interior',
            description: 'Relatos de superación personal y autodescubrimiento',
            category: 'relato',
            type: 'docx',
            size: '1.8 MB',
            uploader: 'Escriba',
            visibility: 'public',
            tags: ['superación', 'inspiración', 'guerrero'],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
        },
        {
            id: '3',
            title: 'Poemas de Fortaleza',
            description: 'Versos que inspiran y elevan el espíritu',
            category: 'poesia',
            type: 'txt',
            size: '856 KB',
            uploader: 'Poeta',
            visibility: 'registered',
            tags: ['poesía', 'fortaleza', 'espíritu'],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
        },
        {
            id: '4',
            title: 'Bienestar y Disciplina',
            description: 'Cómo construir hábitos que transforman tu vida',
            category: 'bienestar',
            type: 'pdf',
            size: '3.2 MB',
            uploader: 'Estratega',
            visibility: 'public',
            tags: ['hábitos', 'disciplina', 'bienestar'],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString()
        },
        {
            id: '5',
            title: 'Análisis de la Mente Moderna',
            description: 'Estudio sobre los patrones de pensamiento y su impacto en la conducta',
            category: 'investigacion',
            type: 'pdf',
            size: '5.7 MB',
            uploader: 'Investigador',
            visibility: 'registered',
            tags: ['mente', 'psicología', 'investigación'],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString()
        },
        {
            id: '6',
            title: 'El Arte de la Resiliencia',
            description: 'Ensayos sobre cómo superar la adversidad y salir fortalecido',
            category: 'ensayo',
            type: 'docx',
            size: '1.2 MB',
            uploader: 'Filósofo',
            visibility: 'public',
            tags: ['resiliencia', 'adversidad', 'fortaleza'],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString()
        }
    ];
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('documentsSearchInput');
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

    // Filtro de visibilidad
    const visibilityFilter = document.getElementById('visibilityFilter');
    if (visibilityFilter) {
        visibilityFilter.addEventListener('change', () => {
            applyFilters();
            renderTable();
        });
    }

    // Filtro de tipo
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
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
            const totalPages = Math.ceil(filteredDocuments.length / DOCUMENTS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }

    // Botón actualizar
    const refreshBtn = document.getElementById('refreshDocsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CARGANDO...';
            await loadDocuments();
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ACTUALIZAR';
            refreshBtn.disabled = false;
        });
    }
}