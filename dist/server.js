import express from "express";
import path from "path";
import nunjucks from 'nunjucks';
import dotenv from "dotenv";
import routes from './routes/index.js';
dotenv.config();
// const routes = require('./routes');
const port = process.env.PORT || 3000;
const app = express();
app.use(express.static("public"));
app.use(express.static("img"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});
console.log('routes value:', routes);
// VIEW ENGINE
app.set("view engine", "html");
nunjucks.configure(path.join(process.cwd(), "src", "app", "pages"), {
    express: app,
    autoescape: false,
    noCache: true
});
app.use(routes);
// app.get("/", (req, res) => {
//     res.sendFile(
//         path.join(process.cwd(), "src", "app", "pages", "index.html")
//     );
// });
// teste rápido
// app.get('/home-test', (req, res) => res.send('rota /home-test OK'));
app.listen(port, () => {
    console.log(`Servidor ligado: http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map