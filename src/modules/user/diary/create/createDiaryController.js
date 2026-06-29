/* ========================================
   createDiaryController.js
   Controlador para la creación de entradas del diario
   ======================================== */

import { DiaryService, DIARY_TAGS } from '../../../../services/diaryService.js';

export function createDiaryController() {
    console.log('Inicializando formulario de creacion de diario...');

    // --- DOM References ---
    const form = document.getElementById('diaryCreateForm');
    const titleInput = document.getElementById('diaryTitle');
    const contentInput = document.getElementById('diaryContent');
    const tagSelect = document.getElementById('diaryTag');
    const titleError = document.getElementById('titleError');
    const contentError = document.getElementById('contentError');
    const cancelBtn = document.getElementById('cancelFormBtn');
    const cancelHeaderBtn = document.getElementById('cancelDiaryBtn');

    // --- MAPEO DE ETIQUETAS (Español -> Inglés) ---
    const TAG_MAP = {
        'victoria': DIARY_TAGS.VICTORIA,
        'aprendizaje': DIARY_TAGS.APRENDIZAJE,
        'batalla': DIARY_TAGS.BATALLA,
        'reflexion': DIARY_TAGS.REFLEXION,
        'logro': DIARY_TAGS.LOGRO
    };

    // --- Helpers ---
    function showError(element) {
        if (element) element.style.display = 'flex';
    }

    function hideError(element) {
        if (element) element.style.display = 'none';
    }

    function validateForm() {
        let isValid = true;

        if (!titleInput.value.trim()) {
            showError(titleError);
            isValid = false;
        } else {
            hideError(titleError);
        }

        if (!contentInput.value.trim()) {
            showError(contentError);
            isValid = false;
        } else {
            hideError(contentError);
        }

        return isValid;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Guardar entrada usando el servicio ---
    async function saveEntry(title, content, tag) {
        try {
            const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
            if (!session || !session.id) {
                throw new Error('Debes iniciar sesion para crear una entrada');
            }

            const tagSpanish = tag;
            const tagEnglish = TAG_MAP[tagSpanish] || DIARY_TAGS.REFLEXION;

            const entryData = {
                title: title.trim(),
                content: content.trim(),
                tag: tagEnglish,
                date: new Date().toISOString()
            };

            console.log('Datos a enviar al servicio:', entryData);

            const newEntry = await DiaryService.createEntry(session.id, entryData);
            
            console.log('Nueva entrada creada:', newEntry);

            document.dispatchEvent(new CustomEvent('diary:created', {
                detail: newEntry
            }));

            showToast('Entrada guardada con exito', 'success');

            setTimeout(() => {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/diario');
                } else {
                    window.location.href = '/diario';
                }
            }, 1200);

        } catch (error) {
            console.error('Error al crear entrada:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo crear la entrada',
                icon: 'error',
                customClass: {
                    popup: 'tyr-popup tyr-error-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm'
                }
            });
        }
    }

    // --- Toast ---
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

    // --- Event Listeners ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (validateForm()) {
                const title = titleInput.value.trim();
                const content = contentInput.value.trim();
                const tag = tagSelect.value;

                await saveEntry(title, content, tag);
            }
        });
    }

    function handleCancel() {
        Swal.fire({
            title: 'Cancelar',
            text: 'Tienes cambios sin guardar. Seguro que quieres salir?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si, salir',
            cancelButtonText: 'Seguir editando',
            customClass: {
                popup: 'tyr-popup',
                title: 'tyr-title',
                htmlContainer: 'tyr-html',
                confirmButton: 'tyr-btn-confirm',
                cancelButton: 'tyr-btn-cancel',
                actions: 'tyr-actions',
                closeButton: 'tyr-close-btn'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('/diario');
                } else {
                    window.location.href = '/diario';
                }
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
    }

    if (cancelHeaderBtn) {
        cancelHeaderBtn.addEventListener('click', handleCancel);
    }

    if (titleInput) {
        titleInput.addEventListener('input', () => {
            if (titleInput.value.trim()) hideError(titleError);
        });
    }

    if (contentInput) {
        contentInput.addEventListener('input', () => {
            if (contentInput.value.trim()) hideError(contentError);
        });
    }

    console.log('Formulario de creacion de diario inicializado correctamente');
}