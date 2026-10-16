import { Router } from 'express';
import SessionController from '../app/shared/controllers/SessionController.js';

const routes = Router();

routes.get('/login', SessionController.loginForm);
routes.post('/login', SessionController.login);
routes.post('/logout', SessionController.logout);

routes.get('/criar-acesso', SessionController.createAcessoForm);
routes.post('/criar-acesso', SessionController.createAcessoPost);

export default routes;