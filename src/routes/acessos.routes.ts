import { Router } from 'express';
import FrontControllers from '../app/acessos/controllers/FrontControllers.js';

const routes = Router();

// Páginas de Visualização Gerais
routes.get('/', FrontControllers.index);
routes.post('/', FrontControllers.post); // <-- Corrigido: Permite o envio do formulário na raiz
routes.get('/form', FrontControllers.createAcesso);
routes.post('/form', FrontControllers.post); // Mantido como garantia
routes.get('/pendentes', FrontControllers.showPending); // <-- Corrigido para português
routes.get('/resolvidos', FrontControllers.showResolved); // <-- Corrigido para português
routes.get('/download-csv', FrontControllers.downloadCSV);

// APIs (Modal e Autocomplete)
routes.get('/api/search', FrontControllers.searchAutocomplete);
routes.get('/api/modal/:ticket', FrontControllers.getModalData);

// Painel Administrativo / Edição Massiva
routes.get('/admin/edit', FrontControllers.showEdit);
routes.post('/admin/update-massivo', FrontControllers.updateMassivo);

// Edição e Deleção Individual
routes.get('/admin/edit/:ticket', FrontControllers.showEditOne);
routes.get('/visualizar/:ticket', FrontControllers.showEditOne);
routes.post('/visualizar/:ticket', FrontControllers.updateEditOne);
routes.put('/visualizar/:ticket', FrontControllers.updateEditOne);
routes.post('/admin/edit/:ticket', FrontControllers.updateEditOne);
routes.post('/admin/delete/:ticket', FrontControllers.deleteEditOne);

export default routes;