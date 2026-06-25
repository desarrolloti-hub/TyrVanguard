// routes.js - versión corregida
import { loginController } from '../modules/visitor/login/loginController.js';
import { createAccountController } from '../modules/visitor/createAccount/createAccountController.js';
import { homeUserController } from '../modules/user/home/homeUserController.js';
import { notFoundController } from '../modules/shared/errors/404Controller.js';
import { createAdminController } from '../modules/admin/createAdmin/createAdminController.js';



// ✅ Función síncrona para obtener la ruta del home
function getHomePath() {
    try {
        const session = localStorage.getItem('user-TYRVANGUARD');
        if (session) {
            const user = JSON.parse(session);
            if (user?.role === 'admin' || user?.role === 'super_admin') {
                return '/modules/admin/home/homeAdmin.html';
            }
            if (user?.role === 'user') {
                return '/modules/user/home/homeUser.html';
            }
        }
    } catch (e) {
        console.warn('Error obteniendo home path:', e);
    }
    return '/modules/visitor/home/home.html';
}

// ✅ Función síncrona para obtener el controller del home
function getHomeController() {
    try {
        const session = localStorage.getItem('user-TYRVANGUARD');
        if (session) {
            const user = JSON.parse(session);
            if (user?.role === 'user') {
                return homeUserController;
            }
            if (user?.role === 'admin' || user?.role === 'super_admin') {
                // Cuando tengas adminController, lo importas aquí
                return null;
            }
        }
    } catch (e) {
        console.warn('Error obteniendo home controller:', e);
    }
    return null;
}

export const routes = {
    // Ruta principal - dinámica según el rol
    "/": {
        view: getHomePath(),
        controller: getHomeController(),
    },

    // Ruta de invitado
    "/home": {
        view: "/modules/visitor/home/home.html",
        controller: null,
    },

    // Ruta de usuario
    "/homeUser": {
        view: "/modules/user/home/homeUser.html",
        controller: homeUserController,
    },

    // Login
    "/iniciarSesion": {
        view: "/modules/visitor/login/login.html",
        controller: loginController,
    },

    // Crear cuenta
    "/crearCuenta": {
        view: "/modules/visitor/createAccount/createAccount.html",
        controller: createAccountController,
    },

    // Dashboard (protegido)
    "/dashboard": {
        view: "/modules/user/home/homeUser.html",
        controller: homeUserController,
        protected: true,
        roles: ['user', 'admin', 'super_admin']
    },


    // admin

    //crearAdmin
      "/crearCuentaAdmin": {
        view: "/modules/admin/createAdmin/createAdmin.html",
        controller: createAdminController,
  
    },




    // 404
    "/404": {
        view: "/modules/shared/errors/404.html",
        controller: notFoundController,
    }
};