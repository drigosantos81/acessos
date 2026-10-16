import { Router } from 'express';
import PagamentosControllers from '../app/pagamentos/controllers/controllersPagamentos.js';
// import AvariasController from '../app/pagamentos/controllers/';

const routes = Router();

routes.get('/', PagamentosControllers.index);

export default routes;