import express from "express";
import path from "path";
import nunjucks from 'nunjucks'
import dotenv from "dotenv";
import session from 'express-session'
import connectSqlite3 from 'connect-sqlite3';
import routes from './routes/index.js';

dotenv.config();

// const routes = require('./routes');
const port = process.env.PORT || 3000;
const SQLiteStore = connectSqlite3(session);
const app = express();

app.use(express.static("public"));
app.use(express.static("img"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store")
    next()
});

// VIEW ENGINE
app.set("view engine", "html")

nunjucks.configure(
    path.join(process.cwd(),"src", "app", "pages"), 
    {
        express: app,
        autoescape: false,
        noCache: true
    }
)

// ==========================================
// CONFIGURAÇÃO DA SESSÃO (Deve vir ANTES das rotas)
// ==========================================
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.sqlite', 
        dir: './src/database', // Garanta que essa pasta existe no seu projeto!
        table: 'sessions',
    }),
    secret: 'tecon-chave-secreta-super-segura',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // Sessão dura 30 dias
    }
}));

// Disponibiliza a sessão para o Nunjucks poder ler no HTML (ex: ocultar botões se não for admin)
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// ==========================================
// ROTAS
// ==========================================
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