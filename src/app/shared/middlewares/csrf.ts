import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
    if (!req.session) return next();

    // Gera um token por sessão caso ainda não exista
    if (!(req.session as any).csrfToken) {
        (req.session as any).csrfToken = crypto.randomBytes(32).toString('hex');
    }

    // Disponibiliza o token para todas as views Nunjucks ({{ csrfToken }})
    res.locals.csrfToken = (req.session as any).csrfToken;

    // Métodos seguros (leitura) não precisam de validação
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Valida o token enviado via formulário (_csrf) ou header (x-csrf-token para Fetch/JSON)
    const tokenRecebido = req.body?._csrf || req.query?._csrf || req.headers['x-csrf-token'];
    if (!tokenRecebido || tokenRecebido !== (req.session as any).csrfToken) {
        return res.status(403).send('Requisição inválida ou expirada (Falha de validação CSRF).');
    }

    return next();
}