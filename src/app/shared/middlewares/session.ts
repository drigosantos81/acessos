import { Request, Response, NextFunction } from 'express';

// 1. Bloqueia quem não está logado
export function onlyUsers(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next(); // Pode passar
}

// 2. Bloqueia quem não é Admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    const userIsAdmin = req.session.isAdmin as any;

    if (userIsAdmin === true || userIsAdmin === 1 || userIsAdmin === '1') {
        return next();
    }

    return res.redirect('/');
}

// 3. NOVO: Valida o acesso dinâmico aos módulos
export function requireModulo(moduloRequerido: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.session.userId) return res.redirect('/login');
        
        const userIsAdmin = req.session.isAdmin as any;
        if (userIsAdmin === true || userIsAdmin === 1 || userIsAdmin === '1') {
            return next();
        }
        
        const modulos = req.session.modulosPermitidos || [];
        if (modulos.includes(moduloRequerido)) return next();
        
        return res.redirect('/'); 
    };
}