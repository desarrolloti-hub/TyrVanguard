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
import { homeAdminController } from '../modules/admin/home/homeAdminController.js';
import { statsController } from '../modules/admin/stats/statsController.js';
import { verifyEmailController } from '../modules/shared/firebase/verifyEmail/verifyEmailController.js';
import { manageUsersController } from '../modules/admin/manageUsers/manageUsersController.js';
import { uploadDocumentsController } from '../modules/admin/documents/uploadDocumentsController.js';
import { createActivityController } from '../modules/admin/activities/createActivitiesController.js';
import { manageActivitiesController } from '../modules/admin/activities/readActivitiesController.js';
import { readActivitiesController } from '../modules/user/activities/readActivitiesController.js';
import { initReadDocumentsAdmin } from '../modules/admin/documents/readDocumentsController.js';
import { initReadDocuments } from '../modules/user/documents/readDocumentsController.js';


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

    //homeAdmin
      "/homeAdmin": {
        view: "/modules/admin/home/homeAdmin.html",
        controller: homeAdminController,
  
    },

    //stats
      "/estadisticas": {
        view: "/modules/admin/stats/stats.html",
        controller: statsController,
  
    },

    // administrador de usuarios
      "/administrarUsuarios": {
        view: "/modules/admin/manageUsers/manageUsers.html",
        controller: manageUsersController,
    },

    //documentos
      "/subirDocumentos": {
        view: "/modules/admin/documents/uploadDocuments.html",
        controller: uploadDocumentsController,
      },

    // administrar documentos

    "/administrarDocumentos": {
        view: "/modules/admin/documents/readDocuments.html",
        controller: initReadDocumentsAdmin,
      },
    
    //documentos user
    "/documentos": {
        view: "/modules/user/documents/readDocuments.html",
        controller: initReadDocuments, // Aquí deberías asignar el controlador correspondiente si lo tienes
    }, 

    // crear actividad
    "/crearActividad": {
        view: "/modules/admin/activities/createActivities.html",
        controller: createActivityController,
    },

    // leer actividades
    "/gestionActividades": {
        view: "/modules/admin/activities/readActivities.html",
        controller: manageActivitiesController, // Aquí deberías asignar el controlador correspondiente si lo tienes
    },


    // leer actividades user
    "/actividades": {
        view: "/modules/user/activities/readActivities.html",
        controller: readActivitiesController, // Aquí deberías asignar el controlador correspondiente si lo tienes
    },



    //homeAdmiverificar correo
      "/vericacionCorreo": {
        view: "/modules/shared/firebase/verifyEmail/verifyEmail.html",
        controller: verifyEmailController,
  
    },
    // 404
    "/404": {
        view: "/modules/shared/errors/404.html",
        controller: notFoundController,
    }
};