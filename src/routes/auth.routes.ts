import { Router } from 'express';
import SessionController from '../app/shared/controllers/SessionController.js';
import { onlyUsers } from '../app/shared/middlewares/session.js';

const routes = Router();

routes.get('/login', SessionController.loginForm);
routes.post('/login', SessionController.login);
routes.post('/logout', SessionController.logout);

routes.get('/criar-acesso', onlyUsers, SessionController.createAcessoForm);
routes.post('/criar-acesso', onlyUsers, SessionController.createAcessoPost);

export default routes;