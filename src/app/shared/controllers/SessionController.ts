import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Users from '../models/Users.js';

export default {
    // ==========================================
    // 1. LOGIN E LOGOUT
    // ==========================================
    loginForm(req: Request, res: Response) {
        return res.render("session/login");
    },

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const user = await Users.findOne({ email });

            if (!user) {
                return res.render("session/login", { error: "Usuário não cadastrado!" });
            }

            const passed = await bcrypt.compare(password, user.password);

            if (!passed) {
                return res.render("session/login", {
                    user: req.body,
                    error: "Senha incorreta."
                });
            }

            // Sessão base
            req.session.userId = user.id;
            req.session.userName = user.name;
            req.session.isAdmin = user.is_admin === 1;

            // NOVO: Busca e salva os módulos permitidos
            const modulos = await Users.getModulosDoUsuario(user.id);
            req.session.modulosPermitidos = modulos;

            // Redirecionamento Inteligente
            if (req.session.isAdmin) {
                return res.redirect("/admin/edit");
            } else {
                return res.redirect("/");
            }

        } catch (error) {
            console.error(error);
            return res.render("session/login", { error: "Erro inesperado, tente novamente." });
        }
    },

    logout(req: Request, res: Response) {
        req.session.destroy((err) => {
            if (err) console.error("Erro ao destruir sessão:", err);
            return res.redirect("/login");
        });
    },

    // ==========================================
    // 2. CRIAÇÃO DE ACESSO (NOVOS USUÁRIOS)
    // ==========================================
    createAcessoForm(req: Request, res: Response) {
        return res.render('session/data_login');
    },

    async createAcessoPost(req: Request, res: Response) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.render('session/data_login', { error: "Todos os campos são obrigatórios." });
            }

            const userExists = await Users.findOne({ email });
            if (userExists) {
                return res.render('session/data_login', { error: "Este e-mail já está em uso." });
            }

            await Users.create({ name, email, password });
            return res.redirect('/login');

        } catch (error) {
            console.error("Erro no SessionController.createAcessoPost:", error);
            return res.render('session/data_login', { error: "Erro ao criar o usuário." });
        }
    },

    // ==========================================
    // 3. EDIÇÃO DE PERFIL DO USUÁRIO LOGADO
    // ==========================================
    async editProfileForm(req: Request, res: Response) {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/login');

            const user = await Users.findOne({ id: userId });
            return res.render('session/data_login', { user });
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            return res.redirect('/');
        }
    },

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/login');

            const { name, email, password } = req.body;

            const userExists = await Users.findOne({ email });
            if (userExists && userExists.id !== userId) {
                return res.render('session/data_login', {
                    user: { id: userId, name, email },
                    error: "Este e-mail já está sendo usado por outra pessoa."
                });
            }

            await Users.update(userId, { name, email, password });
            req.session.userName = name;
            return res.redirect('/');
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            return res.render('session/data_login', { error: "Erro ao salvar as alterações." });
        }
    }
};