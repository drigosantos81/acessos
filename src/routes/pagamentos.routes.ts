import { Router } from 'express';
import PagamentosControllers from '../app/pagamentos/controllers/PagamentosControllers.js';
import { onlyUsers, requireModulo } from '../app/shared/middlewares/session.js';
import { uploadPagamentos, validateMagicBytes } from '../app/shared/middlewares/upload.js';

const routes = Router();

// Rota Principal (Dashboard)
routes.get('/', PagamentosControllers.index);
routes.get('/visualizar/:ticket', PagamentosControllers.viewOne);

// Rotas Globais (Corrigidas)
routes.get('/pendentes', PagamentosControllers.listPendentes);
routes.get('/concluidos', PagamentosControllers.listConcluidos);

// Rotas de Cadastro
routes.get('/form', PagamentosControllers.create);
routes.post('/form', uploadPagamentos, validateMagicBytes, PagamentosControllers.store);

// Rotas de Edição
routes.get('/editar/:ticket', PagamentosControllers.edit);
routes.post('/editar/:ticket', uploadPagamentos, validateMagicBytes, PagamentosControllers.update);

// Rota autenticada para visualização no modal ou download (?download=1)
routes.get('/download/:arquivo', onlyUsers, PagamentosControllers.downloadAnexo);

export default routes;