import { Router } from 'express';
import AvariasController from '../app/avarias/controllers/controllersAvarias.js';

const routes = Router();

routes.get('/', AvariasController.index);

export default routes;