/* ========================================
   UPLOAD DOCUMENTS CONTROLLER
   Subida y visualización de documentos educativos
   ======================================== */

// Estado local
let documents = [];
let selectedFile = null;

export async function uploadDocumentsController() {
    console.log('📄 Upload Documents Controller inicializado');

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

        // Aquí iría la llamada al servicio de documentos
        // documents = await DocumentService.getPublicDocuments();
        // Simulamos datos de ejemplo
        documents = getMockDocuments();

        renderDocuments();

        console.log(`✅ ${documents.length} documentos cargados`);

    } catch (error) {
        console.error('❌ Error cargando documentos:', error);
        showToast('error', 'Error al cargar los documentos');
    }
}

/**
 * Renderiza la lista de documentos
 */
function renderDocuments() {
    const grid = document.getElementById('documentsGrid');
    if (!grid) return;

    if (documents.length === 0) {
        grid.innerHTML = `
            <div class="document-empty">
                <i class="fas fa-book"></i>
                <p>No hay recursos disponibles</p>
                <span>Sé el primero en compartir conocimiento valioso</span>
            </div>
        `;
        return;
    }

    grid.innerHTML = documents.map(doc => `
        <div class="document-item" data-docid="${doc.id}">
            <div class="doc-icon ${getFileIcon(doc.type)}">
                <i class="fas ${getFileIconClass(doc.type)}"></i>
            </div>
            <div class="doc-info">
                <div class="doc-title">${doc.title}</div>
                <div class="doc-meta">
                    <span class="doc-category">${doc.category}</span>
                    <span> • </span>
                    <span>${doc.size}</span>
                    <span> • </span>
                    <span>${doc.uploader}</span>
                </div>
            </div>
            <span class="doc-badge ${doc.visibility}">${getVisibilityLabel(doc.visibility)}</span>
            <button class="doc-download" data-docid="${doc.id}" title="Descargar">
                <i class="fas fa-download"></i>
            </button>
        </div>
    `).join('');

    // Event listeners para descarga
    document.querySelectorAll('.doc-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDownload(btn.dataset.docid);
        });
    });

    // Event listeners para abrir documento
    document.querySelectorAll('.document-item').forEach(item => {
        item.addEventListener('click', () => {
            handleViewDocument(item.dataset.docid);
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

function getVisibilityLabel(visibility) {
    const labels = {
        public: 'Público',
        registered: 'Registrados'
    };
    return labels[visibility] || visibility;
}

/**
 * Maneja la subida del documento
 */
async function handleUpload(e) {
    e.preventDefault();

    const title = document.getElementById('docTitle').value.trim();
    const description = document.getElementById('docDescription').value.trim();
    const category = document.getElementById('docCategory').value;
    const tags = document.getElementById('docTags').value.trim();
    const visibility = document.getElementById('docVisibility').value;

    // Validaciones del formulario
    if (!title) {
        showToast('error', 'El título es obligatorio');
        return;
    }

    if (!category) {
        showToast('error', 'Selecciona una categoría');
        return;
    }

    if (!selectedFile) {
        showToast('error', 'Selecciona un archivo para subir');
        return;
    }

    // Validar tamaño (20MB máximo)
    if (selectedFile.size > 20 * 1024 * 1024) {
        showToast('error', 'El archivo excede el tamaño máximo de 20MB');
        return;
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
        showToast('error', 'Formato de archivo no permitido. Usa PDF, DOC, DOCX, TXT, JPG o PNG');
        return;
    }

    try {
        const submitBtn = document.getElementById('submitDocBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SUBIENDO...';

        // Obtener usuario actual
        const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
        const userId = session?.id || 'anonymous';

        // Datos del documento
        const docData = {
            title,
            description,
            category,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            visibility,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            fileType: selectedFile.type,
            uploadedBy: userId,
            uploaderName: session?.fullName || 'Usuario',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Aquí iría la llamada al servicio
        // await DocumentService.uploadDocument({
        //     ...docData,
        //     file: selectedFile
        // });

        // Simulamos subida
        await new Promise(resolve => setTimeout(resolve, 1500));

        showToast('success', '¡Recurso compartido exitosamente!');

        // Resetear formulario
        document.getElementById('uploadForm').reset();
        resetFilePreview();
        selectedFile = null;

        // Recargar documentos
        await loadDocuments();

    } catch (error) {
        console.error('❌ Error subiendo documento:', error);
        showToast('error', error.message || 'Error al subir el documento');
    } finally {
        const submitBtn = document.getElementById('submitDocBtn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> COMPARTIR RECURSO';
    }
}

/**
 * Maneja la descarga de un documento
 */
function handleDownload(docId) {
    const doc = documents.find(d => d.id === docId);
    if (!doc) {
        showToast('error', 'Documento no encontrado');
        return;
    }

    showToast('info', `Descargando: ${doc.title}`);
    // Aquí iría la lógica de descarga
}

/**
 * Maneja la visualización de un documento
 */
function handleViewDocument(docId) {
    const doc = documents.find(d => d.id === docId);
    if (!doc) {
        showToast('error', 'Documento no encontrado');
        return;
    }

    showToast('info', `Abriendo: ${doc.title}`);
    // Aquí iría la lógica para abrir el documento
}

/**
 * Maneja la selección de archivo
 */
function handleFileSelect(file) {
    if (!file) return;

    selectedFile = file;

    const preview = document.getElementById('uploadPreview');
    const dropzoneContent = document.querySelector('.upload-dropzone-content');
    const previewName = document.getElementById('previewName');
    const previewSize = document.getElementById('previewSize');

    // Mostrar preview
    dropzoneContent.style.display = 'none';
    preview.style.display = 'flex';

    previewName.textContent = file.name;
    previewSize.textContent = formatFileSize(file.size);
}

/**
 * Resetea el preview del archivo
 */
function resetFilePreview() {
    const preview = document.getElementById('uploadPreview');
    const dropzoneContent = document.querySelector('.upload-dropzone-content');
    const fileInput = document.getElementById('fileInput');

    preview.style.display = 'none';
    dropzoneContent.style.display = 'block';
    fileInput.value = '';
    selectedFile = null;
}

/**
 * Formatea el tamaño del archivo
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
    const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
    const userName = session?.fullName || 'Usuario';

    return [
        {
            id: '1',
            title: 'Guía para Fortalecer la Mente',
            description: 'Técnicas y ejercicios para desarrollar resiliencia mental',
            category: 'guia',
            type: 'pdf',
            size: '2.4 MB',
            uploader: 'Comandante',
            visibility: 'public',
            createdAt: new Date().toISOString()
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
            createdAt: new Date().toISOString()
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
            createdAt: new Date().toISOString()
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
            createdAt: new Date().toISOString()
        }
    ];
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleUpload);
        form.addEventListener('reset', () => {
            resetFilePreview();
        });
    }

    // Dropzone - arrastrar y soltar
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    if (dropzone && fileInput) {
        // Click en dropzone abre selector de archivos
        dropzone.addEventListener('click', (e) => {
            if (e.target.closest('.preview-remove')) return;
            fileInput.click();
        });

        // Drag & Drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });

        // Selección de archivo
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }

    // Botón remover archivo
    const removeBtn = document.getElementById('removeFileBtn');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resetFilePreview();
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

    // Botón ver todos
    const viewAllBtn = document.getElementById('viewAllDocsBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            if (window.navigateTo) {
                window.navigateTo('/biblioteca');
            } else {
                window.location.href = '/biblioteca';
            }
        });
    }
}