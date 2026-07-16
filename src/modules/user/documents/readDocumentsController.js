/* ========================================
   READ DOCUMENTS CONTROLLER
   Visualización de documentos (Usuario)
   ======================================== */

// Estado local
let allDocuments = [];
let filteredDocuments = [];

export async function initReadDocuments() {
    console.log('📖 Read Documents Controller inicializado');

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
        // allDocuments = await DocumentService.getPublicDocuments();
        // Simulamos datos de ejemplo
        allDocuments = getMockDocuments();

        // Ordenar por fecha (más reciente primero)
        allDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        applyFilters();
        renderDocuments();

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
    const search = document.getElementById('docsSearchInput')?.value.toLowerCase().trim() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const type = document.getElementById('typeFilter')?.value || 'all';

    filteredDocuments = allDocuments.filter(doc => {
        // Filtro por búsqueda
        if (search) {
            const title = doc.title.toLowerCase();
            const description = doc.description.toLowerCase();
            const uploader = doc.uploader.toLowerCase();
            const tags = doc.tags?.join(' ').toLowerCase() || '';
            if (!title.includes(search) && !description.includes(search) && !uploader.includes(search) && !tags.includes(search)) {
                return false;
            }
        }

        // Filtro por categoría
        if (category !== 'all' && doc.category !== category) {
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
}

/**
 * Renderiza los documentos en grid
 */
function renderDocuments() {
    const grid = document.getElementById('docsGrid');
    if (!grid) return;

    if (filteredDocuments.length === 0) {
        grid.innerHTML = `
            <div class="doc-empty">
                <i class="fas fa-book"></i>
                <p>No hay documentos disponibles</p>
                <span>${allDocuments.length === 0 ? 'Vuelve más tarde para encontrar nuevos recursos' : 'No se encontraron documentos con los filtros aplicados'}</span>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredDocuments.map(doc => `
        <div class="doc-card" data-docid="${doc.id}">
            <div class="doc-card-header">
                <div class="doc-icon ${getFileIcon(doc.type)}">
                    <i class="fas ${getFileIconClass(doc.type)}"></i>
                </div>
                <div class="doc-badges">
                    <span class="doc-format">${doc.type.toUpperCase()}</span>
                    <span class="doc-visibility ${doc.visibility}">${getVisibilityLabel(doc.visibility)}</span>
                </div>
            </div>
            <div class="doc-card-body">
                <h3 class="doc-title">${doc.title}</h3>
                <p class="doc-description">${doc.description}</p>
                <div class="doc-meta">
                    <span class="doc-meta-item">
                        <i class="fas fa-tag"></i> ${getCategoryLabel(doc.category)}
                    </span>
                    <span class="doc-meta-item">
                        <i class="fas fa-file-alt"></i> ${doc.size}
                    </span>
                </div>
                ${doc.tags && doc.tags.length > 0 ? `
                    <div class="doc-tags">
                        ${doc.tags.map(tag => `<span class="doc-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="doc-card-footer">
                <span class="doc-uploader">
                    <i class="fas fa-user"></i> ${doc.uploader}
                </span>
                <div class="doc-action">
                    <button class="btn-download" data-docid="${doc.id}" title="Descargar">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-read" data-docid="${doc.id}">
                        📖 LEER
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Event listeners para leer documento
    document.querySelectorAll('.btn-read').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleReadDocument(btn.dataset.docid);
        });
    });

    // Event listeners para descargar documento
    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDownloadDocument(btn.dataset.docid);
        });
    });

    // Event listeners para abrir tarjeta (ver detalle)
    document.querySelectorAll('.doc-card').forEach(card => {
        card.addEventListener('click', () => {
            handleViewDocument(card.dataset.docid);
        });
    });
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
 * Maneja la lectura de un documento (Modal)
 */
async function handleReadDocument(docId) {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) {
        showToast('error', 'Documento no encontrado');
        return;
    }

    if (typeof Swal === 'undefined') {
        showToast('info', `Abriendo: ${doc.title}`);
        return;
    }

    Swal.fire({
        title: `📖 ${doc.title}`,
        html: `
            <div style="text-align:left;">
                <p style="color:var(--text-muted);font-size:var(--font-size-sm);margin-bottom:12px;">${doc.description}</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--bg-input);padding:12px;border-radius:var(--border-radius-sm);">
                    <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Categoría</span><br><strong>${getCategoryLabel(doc.category)}</strong></div>
                    <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Formato</span><br><strong>${doc.type.toUpperCase()}</strong></div>
                    <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Tamaño</span><br><strong>${doc.size}</strong></div>
                    <div><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Visibilidad</span><br><strong>${getVisibilityLabel(doc.visibility)}</strong></div>
                    <div style="grid-column:1/-1;"><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Subido por</span><br><strong><i class="fas fa-user"></i> ${doc.uploader}</strong></div>
                    <div style="grid-column:1/-1;"><span style="color:var(--text-muted);font-size:var(--font-size-xs);">Fecha</span><br><strong>${new Date(doc.createdAt).toLocaleDateString('es-ES', { year:'numeric', month:'long', day:'numeric' })}</strong></div>
                </div>
                ${doc.tags && doc.tags.length > 0 ? `
                    <div style="margin-top:8px;">
                        <span style="color:var(--text-muted);font-size:var(--font-size-xs);">🏷️ Etiquetas:</span>
                        <span style="color:var(--text-secondary);font-size:var(--font-size-xs);">${doc.tags.join(', ')}</span>
                    </div>
                ` : ''}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '📥 DESCARGAR',
        cancelButtonText: 'CERRAR',
        customClass: {
            popup: 'tyr-popup',
            title: 'tyr-title',
            htmlContainer: 'tyr-html',
            confirmButton: 'tyr-btn-confirm',
            cancelButton: 'tyr-btn-cancel'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            handleDownloadDocument(docId);
        }
    });
}

/**
 * Maneja la visualización de un documento (vista rápida)
 */
function handleViewDocument(docId) {
    // Redirige al modal de lectura
    handleReadDocument(docId);
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

    showToast('success', `⬇️ Descargando: ${doc.title}`);
    // Aquí iría la lógica de descarga
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
            description: 'Técnicas y ejercicios para desarrollar resiliencia mental y emocional en el día a día.',
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
            description: 'Relatos de superación personal y autodescubrimiento para encontrar tu fuerza interior.',
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
            description: 'Versos que inspiran y elevan el espíritu en los momentos más difíciles.',
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
            description: 'Cómo construir hábitos saludables que transforman tu vida para siempre.',
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
            title: 'El Arte de la Resiliencia',
            description: 'Ensayos sobre cómo superar la adversidad y salir fortalecido de cada batalla.',
            category: 'ensayo',
            type: 'docx',
            size: '1.2 MB',
            uploader: 'Filósofo',
            visibility: 'public',
            tags: ['resiliencia', 'adversidad', 'fortaleza'],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString()
        },
        {
            id: '6',
            title: 'Introducción a la Psicología del Guerrero',
            description: 'Fundamentos de la psicología aplicada al desarrollo personal y la disciplina mental.',
            category: 'educacion',
            type: 'pdf',
            size: '4.5 MB',
            uploader: 'Psicólogo',
            visibility: 'registered',
            tags: ['psicología', 'mente', 'disciplina'],
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString()
        }
    ];
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('docsSearchInput');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                applyFilters();
                renderDocuments();
            }, 300);
        });
    }

    // Filtro de categoría
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            applyFilters();
            renderDocuments();
        });
    }

    // Filtro de tipo
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            applyFilters();
            renderDocuments();
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