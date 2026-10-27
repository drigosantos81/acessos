import { Router } from 'express';
import authRoutes from './auth.routes.js';
import acessosRoutes from './acessos.routes.js';
import avariasRoutes from './avarias.routes.js';
import pagamentosRoutes from './pagamentos.routes.js';
import { onlyUsers, requireModulo } from '../app/shared/middlewares/session.js';
import FrontControllers from '../app/acessos/controllers/FrontControllers.js';

const routes = Router();

// ==========================================
// INJEÇÃO GLOBAL DA SESSÃO NO HTML
// ==========================================
routes.use((req, res, next) => {
    res.locals.session = req.session;
    next();
})

// ==========================================
// ROTAS PÚBLICAS (Abertas para todos)
// ==========================================
// Contém a tela de /login e a lógica de autenticação
routes.use('/', authRoutes);

// ==========================================
// ROTAS PROTEGIDAS (Exigem Login e/ou Módulo)
// ==========================================
// Acessos continua exigindo apenas que o usuário esteja logado
routes.use('/', onlyUsers, acessosRoutes);

// Rota da Tela de Consulta Limpa
routes.get('/edit/:ticket', onlyUsers, FrontControllers.showViewOne);

// Rotas do Formulário de Edição (POST em vez de PUT/DELETE)
routes.get('/edit/:ticket', onlyUsers, FrontControllers.showEditOne);
routes.post('/edit/:ticket', onlyUsers, FrontControllers.updateEditOne);
routes.post('/delete/:ticket', onlyUsers, FrontControllers.deleteEditOne);

routes.use('/avarias', requireModulo('avarias'), avariasRoutes);
routes.use('/pagamentos', requireModulo('pagamentos'), pagamentosRoutes);

export default routes;