import express from "express";
import path from "path";
import nunjucks from 'nunjucks';
import dotenv from "dotenv";
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import routes from './routes/index.js';
import methodOverride from 'method-override';

dotenv.config();

const port = process.env.PORT || 3000;
const SQLiteStore = connectSqlite3(session);
const app = express();

app.use(express.static("public"));
app.use(express.static("img"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// VIEW ENGINE
app.set("view engine", "html");

nunjucks.configure(
    path.join(process.cwd(), "src", "app", "pages"),
    {
        express: app,
        autoescape: false,
        noCache: true
    }
);

// ==========================================
// CONFIGURAÇÃO DA SESSÃO (Deve vir ANTES das rotas)
// ==========================================
// Extrai apenas o caminho da pasta a partir do DB_PATH do .env. 
// Ex: Se for G:/.../acessos.sqlite, o dirname pega apenas a pasta onde ele está.
const dbDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : './src/database';

app.use(session({
    store: new SQLiteStore({
        db: 'sessions.sqlite',
        dir: dbDir, // <--- Aponta dinamicamente para a pasta configurada no .env
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

app.listen(port, () => {
    console.log(`Servidor ligado: http://localhost:${port}`);
});