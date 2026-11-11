import { Router } from 'express';
import PagamentosControllers from '../app/pagamentos/controllers/PagamentosControllers.js';
import { uploadPagamentos } from '../app/shared/middlewares/upload.js';

const routes = Router();

// Rota Principal (Dashboard)
routes.get('/', PagamentosControllers.index);
routes.get('/visualizar/:ticket', PagamentosControllers.viewOne);

// Rotas Globais (Corrigidas)
routes.get('/pendentes', PagamentosControllers.listPendentes);
routes.get('/concluidos', PagamentosControllers.listConcluidos);

// Rotas das Tabelas Filiais
routes.get('/empresa/:id', PagamentosControllers.listByEmpresa);

// Rotas de Cadastro
routes.get('/form', PagamentosControllers.create);
routes.post('/form', uploadPagamentos, PagamentosControllers.store);

// Rotas de Edição
routes.get('/editar/:ticket', PagamentosControllers.edit);
routes.post('/editar/:ticket', uploadPagamentos, PagamentosControllers.update);

export default routes;