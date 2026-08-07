import { Request, Response, NextFunction } from "express";
import Acessos from "../models/Acessos.js";

export async function loadMenuCounts(req: Request, res: Response, next: NextFunction) {
    // Se o usuário não estiver logado, não tem o que contar, zera tudo.
    if (!req.session || !req.session.userId) {
        res.locals.counts = { abertos: 0, pendentes: 0, resolvidos: 0 };
        return next();
    }

    try {
        // Pega as contagens no banco e disponibiliza na variável global "counts" do Nunjucks
        res.locals.counts = await Acessos.getMenuCounts(req.session.userId, req.session.isAdmin || false);
    } catch (e) {
        res.locals.counts = { abertos: 0, pendentes: 0, resolvidos: 0 };
    }

    next();
}