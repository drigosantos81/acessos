import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Users from '../models/Users.js';

export default {
    // 1. Renderiza a tela de Login
    loginForm(req: Request, res: Response) {
        return res.render("session/login"); // Vamos criar esse HTML depois
    },

    // 2. Faz o Login de fato
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            // Busca o usuário pelo email
            const user = await Users.findOne({ email });

            if (!user) {
                return res.render("session/login", {
                    error: "Usuário não cadastrado!"
                });
            }

            // Verifica se a senha digitada bate com a embaralhada no banco
            const passed = await bcrypt.compare(password, user.password);

            if (!passed) {
                return res.render("session/login", {
                    user: req.body, // Devolve o email digitado pra não ter que digitar de novo
                    error: "Senha incorreta."
                });
            }

            // A MÁGICA ACONTECE AQUI: Colocamos o ID e se é admin na sessão!
            req.session.userId = user.id;
            req.session.userName = user.name;
            req.session.isAdmin = user.is_admin === 1;

            // REDIRECIONAMENTO INTELIGENTE
            if (req.session.isAdmin) {
                return res.redirect("/admin/edit"); // Admin vai para edição
            } else {
                return res.redirect("/"); // Usuário comum vai para a Home
            }

            return res.redirect("/admin/edit"); // Manda direto pra área restrita

        } catch (error) {
            console.error(error);
            return res.render("session/login", {
                error: "Erro inesperado, tente novamente."
            });
        }
    },

    // 3. Faz o Logout
    logout(req: Request, res: Response) {
        req.session.destroy((err) => {
            if (err) console.error("Erro ao destruir sessão:", err);
            return res.redirect("/"); // Manda de volta pra Home pública
        });
    }
}