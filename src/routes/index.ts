import { Router } from 'express';
import { validateAcesso } from '../app/middlewares/validateAcesso.js';
import FrontControllers from '../app/controllers/FrontControllers.js';
import SessionController from '../app/controllers/SessionController.js'
import { onlyUsers, isAdmin } from '../app/middlewares/session.js';
import path from "path";

const routes = Router();

// ==========================================
// ROTAS PÚBLICAS (Páginas)
// ==========================================
routes.get('/', onlyUsers, FrontControllers.index);

routes.get('/form', onlyUsers, FrontControllers.createAcesso);
routes.get('/login', SessionController.loginForm);  // Exibe o HTML do login
routes.post('/login', SessionController.login);     // Recebe os dados do formulário e valida
routes.post('/logout', SessionController.logout);   // Rota para o botão de "Sair" do sistema

routes.post('/', validateAcesso, FrontControllers.post);

// ==========================================
// ROTAS DE API (Consultas invisíveis do Javascript) / ADMIN
// ==========================================
routes.get('/api/admin/search-nomes', FrontControllers.searchAutocomplete);
routes.get('/admin/edit', isAdmin, FrontControllers.showEdit);
routes.put('/admin/edit', isAdmin, FrontControllers.updateMassivo);

export default routes;