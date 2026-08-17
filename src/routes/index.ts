import { Router } from 'express';
import { validateAcesso } from '../app/middlewares/validateAcesso.js';
import FrontControllers from '../app/controllers/FrontControllers.js';
import SessionController from '../app/controllers/SessionController.js'
import { onlyUsers, isAdmin } from '../app/middlewares/session.js';
import { loadMenuCounts } from '../app/middlewares/loadMenuCounts.js';
import path from "path";

const routes = Router();

routes.use(loadMenuCounts);

// ==========================================
// ROTAS PÚBLICAS (Páginas)
// ==========================================
routes.get('/', onlyUsers, FrontControllers.index);
routes.get('/resolvidos', FrontControllers.showResolved); // Aponta para resolved.html
routes.get('/pendentes', FrontControllers.showPending); // Aponta para pending.html

// ROTAS DE AUTENTICAÇÃO E PERFIL
routes.get('/criar-acesso', SessionController.createAcessoForm);
routes.post('/criar-acesso', SessionController.createAcessoPost);

routes.get('/perfil', onlyUsers, SessionController.editProfileForm);
routes.post('/perfil/editar', onlyUsers, SessionController.updateProfile);

// NAVEGAÇÃO APÓS LOGIN
routes.get('/form', onlyUsers, FrontControllers.createAcesso);
routes.get('/login', SessionController.loginForm);  // Exibe o HTML do login
routes.post('/login', SessionController.login);     // Recebe os dados do formulário e valida
routes.post('/logout', SessionController.logout);   // Rota para o botão de "Sair" do sistema

routes.post('/', validateAcesso, FrontControllers.post); //Envia os dados para o banco de dados

// EDIÇÃO DE REGISTROS
routes.get('/visualizar/:ticket', onlyUsers, FrontControllers.showEditOne); // Renderiza a página de edição individual (acessível para usuários comuns e admins, a lógica de bloqueio é tratada no front e no controller)
routes.get('/api/modal/:ticket', onlyUsers, FrontControllers.getModalData); // Rota invisível (API) que o JavaScript vai chamar quando clicar no botão do Modal
routes.put('/visualizar/:ticket', onlyUsers, FrontControllers.updateEditOne);   // Recebe os dados de atualização vindos do formulário
routes.delete('/visualizar/:ticket', onlyUsers, FrontControllers.deleteEditOne);    // (Opcional) Rota de deleção caso você implemente o botão de deletar

// ==========================================
// ROTAS DE API (Consultas invisíveis do Javascript) / ADMIN
// ==========================================
routes.get('/api/admin/search-nomes', FrontControllers.searchAutocomplete);
routes.get('/download-csv', FrontControllers.downloadCSV);
routes.get('/admin/edit', isAdmin, FrontControllers.showEdit);
routes.put('/admin/edit', isAdmin, FrontControllers.updateMassivo);

export default routes;