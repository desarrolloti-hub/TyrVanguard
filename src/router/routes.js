


import { loginController } from '../modules/visitor/login/loginController.js';
import {createAccountController} from '../modules/visitor/createAccount/createAccountController.js'

export const routes = {


    "/": {
        view: "/modules/visitor/home/home.html",
        controller: null,
    },

    // login
        "/inicioSesion": {
        view: "/modules/visitor/login/login.html",
        controller: loginController,
    },
    //crear cuenta
       "/crearCuenta": {
        view: "/modules/visitor/createAccount/createAccount.html",
        controller: createAccountController,
    },


}

