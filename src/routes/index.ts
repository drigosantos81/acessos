import { Router } from 'express';
import authRoutes from './auth.routes.js';
import acessosRoutes from './acessos.routes.js';
import avariasRoutes from './avarias.routes.js';
import pagamentosRoutes from './pagamentos.routes.js';
import { onlyUsers, requireModulo } from '../app/shared/middlewares/session.js';

const routes = Router();

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

// Avarias e Pagamentos exigem o login E a permissão específica no banco
routes.use('/avarias', requireModulo('avarias'), avariasRoutes);
routes.use('/pagamentos', requireModulo('pagamentos'), pagamentosRoutes);

export default routes;