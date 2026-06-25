/* ========================================
   LOAD LAYOUT - Versión corregida
   ======================================== */

import { LayoutManager } from './layoutManager.js';

let layoutInitialized = false;

/**
 * Carga los layouts persistentes en el DOM
 * @returns {Promise<Object>} - Retorna el layout cargado
 */
export async function loadLayout() {
    // Evitar cargar múltiples veces
    if (layoutInitialized) {
        console.log('ℹ️ Layout ya inicializado');
        return LayoutManager.getCurrentLayout();
    }
    
    try {
        // Usar el LayoutManager para cargar el layout correspondiente
        const result = await LayoutManager.updateLayout();
        
        // Inicializar el listener de cambios de autenticación (solo una vez)
        if (!layoutInitialized) {
            LayoutManager.initLayoutListener();
            layoutInitialized = true;
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Error cargando layout:', error);
        
        // Fallback: cargar layout guest
        const result = await LayoutManager.loadGuestLayout();
        return result;
    }
}

/**
 * Fuerza la recarga del layout (útil después de login/logout)
 */
export async function reloadLayout() {
    console.log('🔄 Recargando layout...');
    layoutInitialized = false;
    const result = await loadLayout();
    console.log('✅ Layout recargado:', result);
    return result;
}

// Exponer para uso global
window.reloadLayout = reloadLayout;