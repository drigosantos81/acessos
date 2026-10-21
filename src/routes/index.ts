import { Router } from 'express';
import authRoutes from './auth.routes.js';
import acessosRoutes from './acessos.routes.js';
import avariasRoutes from './avarias.routes.js';
import { onlyUsers } from '../app/shared/middlewares/session.js';

const routes = Router();

// ==========================================
// ROTAS PÚBLICAS (Abertas para todos)
// ==========================================
// Contém a tela de /login e a lógica de autenticação
routes.use('/', authRoutes);

// ==========================================
// ROTAS PROTEGIDAS (Exigem Login)
// ==========================================
// Ao colocar o 'onlyUsers' aqui, TODAS as rotas de acessos e avarias ficam blindadas.
// Se alguém digitar localhost:3000/, o onlyUsers intercepta e manda pro /login.

routes.use('/', onlyUsers, acessosRoutes);
routes.use('/avarias', onlyUsers, avariasRoutes);

export default routes;