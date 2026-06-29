/* ========================================
   battleCreateController.js
   Controlador para crear nuevas batallas
   ======================================== */

import { BattleService, BATTLE_TYPES } from '../../../../services/battleService.js';

export function battleCreateController() {
    console.log('⚔️ Inicializando Creación de Batalla...');

    // --- 1. DOM References ---
    const form = document.getElementById('battleCreateForm');
    const nameInput = document.getElementById('battleName');
    const typeInput = document.getElementById('battleType');
    const durationInput = document.getElementById('battleDuration');
    const durationUnitInput = document.getElementById('battleDurationUnit');
    const descriptionInput = document.getElementById('battleDescription');
    const goalsInput = document.getElementById('battleGoals');
    const nameError = document.getElementById('nameError');
    const durationError = document.getElementById('durationError');
    const cancelBtn = document.getElementById('cancelBattleBtn');
    const cancelFormBtn = document.getElementById('cancelFormBtn');

    // --- MAPEO DE TIPOS (Español -> Inglés) ---
    const TYPE_MAP = {
        'fisico': BATTLE_TYPES.FISICO,      // 'physical'
        'mental': BATTLE_TYPES.MENTAL,      // 'mental'
        'espiritual': BATTLE_TYPES.ESPIRITUAL, // 'spiritual'
        'social': BATTLE_TYPES.SOCIAL,      // 'social'
        'creativo': BATTLE_TYPES.CREATIVO   // 'creative'
    };

    // --- MAPEO DE UNIDADES (Español -> Inglés) ---
    const UNIT_MAP = {
        'minutos': 'minutes',
        'horas': 'hours'
    };

    // --- 2. Validación ---
    function validateForm() {
        let isValid = true;

        // Validar nombre
        const name = nameInput.value.trim();
        if (!name || name.length < 2) {
            nameInput.classList.add('error');
            nameError.style.display = 'flex';
            isValid = false;
        } else {
            nameInput.classList.remove('error');
            nameError.style.display = 'none';
        }

        // Validar tipo
        if (!typeInput.value) {
            typeInput.classList.add('error');
            isValid = false;
        } else {
            typeInput.classList.remove('error');
        }

        // Validar duración
        const duration = parseInt(durationInput.value);
        if (!duration || duration < 1) {
            durationInput.classList.add('error');
            durationError.style.display = 'flex';
            isValid = false;
        } else {
            durationInput.classList.remove('error');
            durationError.style.display = 'none';
        }

        return isValid;
    }

    // --- 3. Guardar batalla usando el servicio ---
    async function saveBattle(event) {
        event.preventDefault();

        if (!validateForm()) {
            Swal.fire({
                title: '⚔️ Campos inválidos',
                text: 'Revisa los campos resaltados y corrígelos.',
                icon: 'error',
                customClass: {
                    popup: 'tyr-popup tyr-error-popup',
                    title: 'tyr-title',
                    htmlContainer: 'tyr-html',
                    confirmButton: 'tyr-btn-confirm'
                }
            });
            return;
        }

        try {
            // Obtener usuario actual
            const session = JSON.parse(localStorage.getItem('user-TYRVANGUARD') || '{}');
            if (!session || !session.id) {
                throw new Error('Debes iniciar sesión para crear una batalla');
            }

            // ✅ MAPEAR EL TIPO DE ESPAÑOL A INGLÉS
            const typeSpanish = typeInput.value;
            const typeEnglish = TYPE_MAP[typeSpanish];
            
            if (!typeEnglish) {
                throw new Error(`Tipo de batalla no válido: ${typeSpanish}`);
            }

            // ✅ MAPEAR LA UNIDAD DE ESPAÑOL A INGLÉS
            const unitSpanish = durationUnitInput.value;
            const unitEnglish = UNIT_MAP[unitSpanish] || 'minutes';

            // Obtener valores
            const battleData = {
                name: nameInput.value.trim(),
                type: typeEnglish, // ✅ Ahora es 'physical', 'mental', etc.
                duration: parseInt(durationInput.value),
                durationUnit: unitEnglish, // ✅ Ahora es 'minutes' o 'hours'
                description: descriptionInput.value.trim(),
                goals: goalsInput.value ? goalsInput.value.split('\n').filter(g => g.trim()) : []
            };

            console.log('📦 Datos a enviar al servicio:', battleData);

            // Crear batalla usando el servicio
            const newBattle = await BattleService.createBattle(session.id, battleData);
            
            console.log('⚔️ Nueva batalla creada:', newBattle);

            // Mostrar éxito
            Swal.fire({
                title: '⚔️ Batalla Registrada',
                html: `
                    <div style="text-align: left;">
                        <p><strong>${newBattle.name}</strong></p>
                        <p style="color: var(--text-muted); font-size: var(--font-size-sm);">
                            <i class="fas fa-clock"></i> ${newBattle.durationText} &bull; 
                            <span class="type-tag type-${newBattle.type}" style="display: inline-flex; padding: 2px 10px;">
                                ${newBattle.typeLabel}
                            </span>
                        </p>
                        ${newBattle.description ? `<p style="color: var(--text-secondary); font-size: var(--font-size-sm);">${newBattle.description}</p>` : ''}
                        ${newBattle.goalCount > 0 ? `<p style="color: var(--text-muted); font-size: var(--font-size-xs);">🎯 ${newBattle.goalCount} metas definidas</p>` : ''}
                    </div>
                `,
                icon: 'success',
                confirmButtonText: '⚔️ IR A MIS BATALLAS',
                cancelButtonText: 'CREAR OTRA',
                showCancelButton: true,
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
                        window.navigateTo('/batallas');
                    } else {
                        window.location.href = '/batallas';
                    }
                } else {
                    form.reset();
                    durationInput.value = 30;
                    document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => {
                        el.classList.remove('error');
                    });
                    document.querySelectorAll('.form-error').forEach(el => {
                        el.style.display = 'none';
                    });
                    nameInput.focus();
                }
            });

        } catch (error) {
            console.error('Error al crear batalla:', error);
            Swal.fire({
                title: '❌ Error',
                text: error.message || 'No se pudo crear la batalla',
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

    // --- 4. Event Listeners ---

    if (form) {
        form.addEventListener('submit', saveBattle);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('/batallas');
            } else {
                window.location.href = '/batallas';
            }
        });
    }

    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', () => {
            if (form) {
                const hasChanges = nameInput.value.trim() || 
                                  descriptionInput.value.trim() || 
                                  goalsInput.value.trim();
                
                if (hasChanges) {
                    Swal.fire({
                        title: '⚠️ ¿Cancelar?',
                        text: 'Tienes cambios sin guardar. ¿Seguro que quieres salir?',
                        icon: 'warning',
                        confirmButtonText: 'SÍ, SALIR',
                        cancelButtonText: 'SEGUIR EDITANDO',
                        showCancelButton: true,
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
                                window.navigateTo('/batallas');
                            } else {
                                window.location.href = '/batallas';
                            }
                        }
                    });
                } else {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('/batallas');
                    } else {
                        window.location.href = '/batallas';
                    }
                }
            }
        });
    }

    console.log('✅ Creación de Batalla inicializada correctamente');
}