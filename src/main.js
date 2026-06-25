import { loadLayout } from './modules/shared/loadLayout/loadLayout.js';
import { initRouter } from './router/router.js';

function loadExternalScripts() {
    return new Promise((resolve) => {
        // Verificar si ya están cargados
        if (document.querySelector('script[src*="swiper"]')) {
            resolve();
            return;
        }
        
        // Cargar AOS
        const aosLink = document.createElement('link');
        aosLink.rel = 'stylesheet';
        aosLink.href = 'https://unpkg.com/aos@2.3.1/dist/aos.css';
        document.head.appendChild(aosLink);
        
        const aosScript = document.createElement('script');
        aosScript.src = 'https://unpkg.com/aos@2.3.1/dist/aos.js';
        aosScript.onload = () => {
            window.AOS = AOS;
        };
        document.body.appendChild(aosScript);
        
        // Cargar Swiper
        const swiperLink = document.createElement('link');
        swiperLink.rel = 'stylesheet';
        swiperLink.href = 'https://unpkg.com/swiper/swiper-bundle.min.css';
        document.head.appendChild(swiperLink);
        
        const swiperScript = document.createElement('script');
        swiperScript.src = 'https://unpkg.com/swiper/swiper-bundle.min.js';
        swiperScript.onload = () => {
            window.Swiper = Swiper;
            resolve();
        };
        document.body.appendChild(swiperScript);
        
        // Timeout por si fallan
        setTimeout(resolve, 3000);
    });
}

/**
 * Inicializa la aplicación
 */
async function initApp() {
    try {
        // 1. Cargar scripts externos
        await loadExternalScripts();
        
        // 2. Cargar layouts (esto ahora decide automáticamente según el rol)
        const layoutResult = await loadLayout();
        console.log('📐 Layout cargado:', layoutResult);
        
        // 3. Inicializar router (el router usará el layout para decidir la home)
        initRouter();
        
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando aplicación:', error);
    }
}

// Iniciar aplicación
initApp();