import { Router } from 'express';
import FrontControllers from '../app/acessos/controllers/FrontControllers.js';

const routes = Router();

// Páginas de Visualização Gerais
routes.get('/', FrontControllers.index);
routes.get('/form', FrontControllers.createAcesso);
routes.post('/form', FrontControllers.post);
routes.get('/pending', FrontControllers.showPending);
routes.get('/resolved', FrontControllers.showResolved);
routes.get('/download-csv', FrontControllers.downloadCSV);

// APIs (Modal e Autocomplete)
routes.get('/api/search', FrontControllers.searchAutocomplete);
routes.get('/api/modal/:ticket', FrontControllers.getModalData);

// Painel Administrativo / Edição
routes.get('/admin/edit', FrontControllers.showEdit);
routes.post('/admin/update-massivo', FrontControllers.updateMassivo);

// Edição e Deleção Individual
routes.get('/admin/edit/:ticket', FrontControllers.showEditOne);
routes.post('/admin/edit/:ticket', FrontControllers.updateEditOne);
routes.post('/admin/delete/:ticket', FrontControllers.deleteEditOne);

export default routes;