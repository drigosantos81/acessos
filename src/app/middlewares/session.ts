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
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    if (!req.session.isAdmin) {
        return res.redirect('/'); // Se não for admin, chuta de volta pra Home
    }

    next(); // É admin, pode passar
}