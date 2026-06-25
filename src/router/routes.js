


import { loginController } from '../modules/visitor/login/loginController.js';
import {createAccountController} from '../modules/visitor/createAccount/createAccountController.js'

//user
import {homeUserController} from '../modules/user/home/homeUserController.js'

export const routes = {


    "/": {
        view: "/modules/visitor/home/home.html",
        controller: null,
    },

    // login
        "/iniciarSesion": {
        view: "/modules/visitor/login/login.html",
        controller: loginController,
    },
    //crear cuenta
       "/crearCuenta": {
        view: "/modules/visitor/createAccount/createAccount.html",
        controller: createAccountController,
    },



    //user

    //homeUser   a esta no supe como ponerle jaja
    "/homeUser": {
        view: "/modules/user/home/homeUser.html",
        controller:  homeUserController,
    },
   

}

