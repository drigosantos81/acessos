import { Router } from 'express';
import authRoutes from './auth.routes.js';
import acessosRoutes from './acessos.routes.js';
import avariasRoutes from './avarias.routes.js';
import pagamentosRoutes from './pagamentos.routes.js';

// Middlewares
import { onlyUsers, requireModulo } from '../app/shared/middlewares/session.js';
import { loadMenuCounts } from '../app/shared/middlewares/loadMenuCounts.js'; // Garantir importação correta

import FrontControllers from '../app/acessos/controllers/FrontControllers.js';

const routes = Router();

// ==========================================
// INJEÇÃO GLOBAL DA SESSÃO E CONTAGEM (Nunjucks)
// ==========================================
routes.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});
routes.use(loadMenuCounts);


// ==========================================
// ROTAS PÚBLICAS (Abertas para todos)
// ==========================================
routes.use('/', authRoutes);


// ==========================================
// ROTAS PROTEGIDAS (Acessos)
// ==========================================
routes.use('/', onlyUsers, acessosRoutes);

// Rota para a Tela de Consulta (Visualizar Limpa)
routes.get('/visualizar/:ticket', onlyUsers, FrontControllers.showViewOne);

// Rotas do Formulário de Edição (POST no lugar de PUT/DELETE)
routes.get('/edit/:ticket', onlyUsers, FrontControllers.showEditOne);
routes.post('/edit/:ticket', onlyUsers, FrontControllers.updateEditOne);
routes.post('/delete/:ticket', onlyUsers, FrontControllers.deleteEditOne);


// ==========================================
// ROTAS DE OUTROS MÓDULOS (Avarias e Pagamentos)
// ==========================================
// Nota: O requireModulo já está sendo passado internamente ou pode ser passado aqui. 
// Para manter a segurança, bloqueamos a base da rota aqui.
routes.use('/avarias', onlyUsers, requireModulo('avarias'), avariasRoutes);
routes.use('/pagamentos', onlyUsers, requireModulo('pagamentos'), pagamentosRoutes);

export default routes;