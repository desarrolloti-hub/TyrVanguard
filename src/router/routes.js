// routes.js - versión corregida
import { loginController } from '../modules/visitor/login/loginController.js';
import { createAccountController } from '../modules/visitor/createAccount/createAccountController.js';
import { homeUserController } from '../modules/user/home/homeUserController.js';
import { notFoundController } from '../modules/shared/errors/404Controller.js';
import { createAdminController } from '../modules/admin/createAdmin/createAdminController.js';
import { readDiaryController} from '../modules/user/diary/read/readDiaryController.js';
import {createDiaryController } from '../modules/user/diary/create/createDiaryController.js';
import {profileController} from '../modules/user/profile/profileController.js';
import { readBattlesController } from '../modules/user/battles/read/readBattlesController.js';
import { battleCreateController } from '../modules/user/battles/create/createBattlesController.js';
import { readGoalsController } from '../modules/user/goals/read/readGoalsController.js';
import { createGoalController } from '../modules/user/goals/create/createGoalsController.js';



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

        // diary
    "/diario": {
        view: "/modules/user/diary/read/readDiary.html",
        controller: readDiaryController,
    },

           // diary
    "/crearDiario": {
        view: "/modules/user/diary/create/createDiary.html",
        controller: createDiaryController,
    },

    //profile
        "/perfilUsuario": {
        view: "/modules/user/profile/profile.html",
        controller: profileController,
    },
    
    //batalla
    "/batallas": {
        view: "/modules/user/battles/read/ReadBattles.html",
        controller: readBattlesController,
    },
    //crear  batalla

    "/crearBatallas": {
        view: "/modules/user/battles/create/createBattles.html",
        controller: battleCreateController,
    },
    

      //metas

      //read metas
    "/metas": {
        view: "/modules/user/goals/read/readGoals.html",
        controller: readGoalsController,
    },
    //crear metas

    "/crearMetas": {
        view: "/modules/user/goals/create/createGoals.html",
        controller: createGoalController,
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