import { Request, Response, NextFunction } from 'express';

// Bloqueia quem não está logado
export function onlyUsers(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next(); // Pode passar
}

// Bloqueia quem não é Admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
    // 1. Verifica se está logado primeiro
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    // 2. Checagem blindada para o SQLite (Aceita booleano, número 1 ou string '1')
    const userIsAdmin = req.session.isAdmin as any;
    
    if (userIsAdmin === true || userIsAdmin === 1 || userIsAdmin === '1') {
        return next(); // É admin comprovado, pode passar!
    }

    // Se falhou na checagem acima, chuta de volta pra Home
    return res.redirect('/'); 
}