import express from "express";
import path from "path";
import nunjucks from 'nunjucks';
import dotenv from "dotenv";
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import methodOverride from 'method-override';

import routes from './routes/index.js';
import { csrfProtection } from './app/shared/middlewares/csrf.js'

dotenv.config();

const port = process.env.PORT || 3000;
const SQLiteStore = connectSqlite3(session);
export const app = express();

// ==========================================
// CONFIGURAÇÃO DA SESSÃO (Deve vir ANTES das rotas)
// ==========================================
// Extrai apenas o caminho da pasta a partir do DB_PATH do .env. 
// Ex: Se for G:/.../acessos.sqlite, o dirname pega apenas a pasta onde ele está.
const dbDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : './src/database';

app.use(express.static("public"));
app.use(express.static("img"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.sqlite',
        dir: dbDir, // <--- Aponta dinamicamente para a pasta configurada no .env
        table: 'sessions',
    }),
    secret: process.env.SESSION_SECRET || 'fallback-apenas-dev-local',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        // maxAge: 30 * 24 * 60 * 60 * 1000 // Sessão dura 30 dias
    }
}));
app.use(csrfProtection);
app.use(methodOverride('_method'));

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// VIEW ENGINE
app.set("view engine", "html");

nunjucks.configure([
    path.join(process.cwd(), "src", "app", "acessos", "pages"),
    path.join(process.cwd(), "src", "app", "avarias", "pages"),
    path.join(process.cwd(), "src", "app", "pagamentos", "pages"),
    path.join(process.cwd(), "src", "app", "fornecedores", "pages"),
    path.join(process.cwd(), "src", "app", "shared", "pages")
],
    {
        express: app,
        autoescape: true,
        noCache: true
    }
);

// Disponibiliza a sessão para o Nunjucks poder ler no HTML (ex: ocultar botões se não for admin)
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// ==========================================
// ROTAS
// ==========================================
app.use(routes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Erro não tratado:', err);
    if (res.headersSent) {
        return next(err);
    }
    return res.status(err.status || 500).send('Ocorreu um erro interno no servidor. Tente novamente mais tarde.');
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Servidor ligado: http://localhost:${port}`);
    });
}