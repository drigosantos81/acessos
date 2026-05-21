import { Router } from 'express';
import { validateAcesso } from '../app/middlewares/validateAcesso.js';
const routes = Router();
import FrontControllers from '../app/controllers/FrontControllers.js';
routes.get('/', FrontControllers.index);
routes.get('/form', FrontControllers.createAcesso);
routes.post('/', validateAcesso, FrontControllers.post);
export default routes;
// routes.get("/", (req, res) => {
//     res.sendFile(
//         path.resolve("src/app/pages/index.html")
//     )
// })
// routes.get("/home", (req, res) => {
//     res.sendFile(
//         path.resolve("src/app/pages/home.html")
//     )
// })
//# sourceMappingURL=index.js.map