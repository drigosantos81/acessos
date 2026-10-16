import { Router } from 'express';
import authRoutes from './auth.routes.js';
import acessosRoutes from './acessos.routes.js';
import avariasRoutes from './avarias.routes.js';
import pagamentosRoutes from './pagamentos.routes.js';

const routes = Router();

// Rotas de Autenticação não têm prefixo (ficam na raiz como /login)
routes.use('/', authRoutes);

// Rotas de Acessos ficam na raiz por enquanto (ou você pode mudar para '/acessos')
routes.use('/', acessosRoutes);

// Tudo de avarias começa com /avarias
routes.use('/avarias', avariasRoutes);

// Tudo de avarias começa com /avarias
routes.use('/pagamentos', pagamentosRoutes);


export default routes;