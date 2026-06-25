/* ========================================
   homeUserController.js
   Controlador del Dashboard de Usuario
   ======================================== */

export function homeUserController() {
    console.log('⚔️ Inicializando Home User...');

    // --- 1. Simulación de datos (Conexión con API/Store) ---
    const userData = {
        name: 'Thor',
        streak: 12,
        totalWins: 45,
        freeDays: 120,
        mentalLevel: 3,
        offensiveCount: 8,
        progress: 65 // Porcentaje hacia la meta máxima
    };

    // --- 2. Renderizar datos estáticos en el DOM ---
    function renderUserData() {
        const nameDisplay = document.getElementById('userNameDisplay');
        const streakDisplay = document.getElementById('streakDisplay');
        const totalWins = document.getElementById('totalWins');
        const freeDays = document.getElementById('freeDays');
        const mentalLevel = document.getElementById('mentalLevel');
        const offensiveCount = document.getElementById('offensiveCount');
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');

        if (nameDisplay) nameDisplay.textContent = userData.name;
        if (streakDisplay) streakDisplay.textContent = userData.streak;
        if (totalWins) totalWins.textContent = userData.totalWins;
        if (freeDays) freeDays.textContent = userData.freeDays;
        if (mentalLevel) mentalLevel.textContent = `${userData.mentalLevel} / 4`;
        if (offensiveCount) offensiveCount.textContent = userData.offensiveCount;
        if (progressFill) progressFill.style.width = `${userData.progress}%`;
        if (progressPercentage) progressPercentage.textContent = `${userData.progress}%`;
    }

    // --- 3. Funcionalidad de Botones ---

    // Agregar Actividad
    const addActivityBtn = document.getElementById('addActivityBtn');
    if (addActivityBtn) {
        addActivityBtn.addEventListener('click', () => {
            // Aquí iría un modal o prompt para agregar actividad
            alert('⚔️ Abrir modal para agregar una nueva actividad');
        });
    }

    // Agregar Meta
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            alert('🎯 Abrir modal para agregar una nueva meta');
        });
    }

    // Nueva Entrada de Diario
    const newEntryBtn = document.getElementById('newEntryBtn');
    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', () => {
            alert('📝 Abrir modal para escribir en el diario');
        });
    }

    // --- 4. Acciones en los Items (Delegación de eventos) ---

    // Actividades: Completar y Eliminar
    const activityList = document.getElementById('activityList');
    if (activityList) {
        activityList.addEventListener('click', (e) => {
            const completeBtn = e.target.closest('.complete-btn');
            const deleteBtn = e.target.closest('.delete-btn');

            if (completeBtn) {
                const item = completeBtn.closest('.activity-item');
                if (item) {
                    item.style.opacity = '0.5';
                    item.style.borderColor = 'var(--color-secondary)';
                    // Aquí iría la lógica para marcar como completada
                    alert('✅ Actividad completada. ¡Bien hecho!');
                }
            }

            if (deleteBtn) {
                const item = deleteBtn.closest('.activity-item');
                if (item) {
                    if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
                        item.remove();
                        alert('🗑️ Actividad eliminada.');
                    }
                }
            }
        });
    }

    // Diario: Editar y Eliminar
    const journalList = document.getElementById('journalList');
    if (journalList) {
        journalList.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-ghost')?.querySelector('.fa-edit');
            const deleteBtn = e.target.closest('.btn-ghost')?.querySelector('.fa-trash');

            if (editBtn) {
                const entry = editBtn.closest('.journal-entry');
                if (entry) {
                    alert('✏️ Abrir editor para esta entrada del diario.');
                }
            }

            if (deleteBtn) {
                const entry = deleteBtn.closest('.journal-entry');
                if (entry) {
                    if (confirm('¿Eliminar esta entrada del diario?')) {
                        entry.remove();
                        alert('🗑️ Entrada eliminada.');
                    }
                }
            }
        });
    }

    // --- 5. Evento de la Racha (ejemplo interactivo) ---
    // Podrías agregar un efecto al pasar el mouse sobre la racha
    const streakCard = document.querySelector('.user-streak-card');
    if (streakCard) {
        streakCard.addEventListener('mouseenter', () => {
            streakCard.style.boxShadow = '0 0 30px rgba(245, 158, 11, 0.15)';
        });
        streakCard.addEventListener('mouseleave', () => {
            streakCard.style.boxShadow = 'none';
        });
    }

    // --- 6. Ejecutar renderizado ---
    renderUserData();

    console.log('✅ Home User inicializado correctamente');
}