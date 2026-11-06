import { Router } from 'express';
import PagamentosControllers from '../app/pagamentos/controllers/PagamentosControllers.js';
import { uploadPagamentos } from '../app/shared/middlewares/upload.js';

const routes = Router();

// Tabela Inicial
routes.get('/', (req, res) => {
    res.render('../../pagamentos/pages/index', { activeMenu: 'pagamentos' });
});

// Formulário de Cadastro (GET)
routes.get('/form', (req, res) => {
    res.render('../../pagamentos/pages/form', { activeMenu: 'pagamentos' });
});

// Processamento do Cadastro (POST) - Apenas UM redirect
routes.post('/form', uploadPagamentos, PagamentosControllers.store);

// Rotas do menu lateral
routes.get('/tecon', (req, res) => res.redirect('/pagamentos'));
routes.get('/cls-depot', (req, res) => res.redirect('/pagamentos'));

export default routes;