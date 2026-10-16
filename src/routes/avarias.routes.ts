import { Router } from 'express';
import AvariasController from '../app/avarias/controllers/controllersAvarias.js';

const routes = Router();

routes.get('/', AvariasController.index);
routes.get('/registro-interno', AvariasController.formFuncionario);
routes.get('/ressarcimento', AvariasController.formMotorista);

export default routes;