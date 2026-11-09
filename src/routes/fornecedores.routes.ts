import { Router } from 'express';
import FornecedoresControllers from '../app/fornecedores/controllers/fornecedoresControllers.js';

// Caso você tenha um middleware de validação de sessão, pode importá-lo:
// import { validateSession } from '../app/shared/middlewares/session.js';

const routes = Router();

// Rota principal (Cairá na página Em Construção)
// Se usar middleware: routes.get('/fornecedores', validateSession, FornecedoresControllers.index);
routes.get('/fornecedores', FornecedoresControllers.index);

export default routes;