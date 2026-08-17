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

            // Colocamos o ID e se é admin na sessão
            req.session.userId = user.id;
            req.session.userName = user.name;
            req.session.isAdmin = user.is_admin === 1;

            // Redirecionamento Inteligente
            if (req.session.isAdmin) {
                return res.redirect("/admin/edit"); // Admin vai para edição
            } else {
                return res.redirect("/"); // Usuário comum vai para a Home
            }

        } catch (error) {
            console.error(error);
            return res.render("session/login", {
                error: "Erro inesperado, tente novamente."
            });
        }
    },

    logout(req: Request, res: Response) {
        req.session.destroy((err) => {
            if (err) console.error("Erro ao destruir sessão:", err);
            return res.redirect("/login"); // Manda de volta pra Home pública
        });
    },

    // ==========================================
    // 2. CRIAÇÃO DE ACESSO (NOVOS USUÁRIOS)
    // ==========================================
    createAcessoForm(req: Request, res: Response) {
        // Renderiza o formulário reaproveitável
        return res.render('session/data_login');
    },

    async createAcessoPost(req: Request, res: Response) {
        try {
            const { name, email, password } = req.body;

            // Validação de campos
            if (!name || !email || !password) {
                return res.render('session/data_login', { error: "Todos os campos são obrigatórios." });
            }

            // Impede e-mails duplicados
            const userExists = await Users.findOne({ email });
            if (userExists) {
                return res.render('session/data_login', { error: "Este e-mail já está em uso." });
            }

            // Cadastra no banco
            await Users.create({ name, email, password });

            // Redireciona para o login (você pode passar uma mensagem de sucesso via URL se quiser)
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

            // Busca os dados do usuário logado para preencher a tela
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

            // Verifica se o usuário tentou trocar para um e-mail que já é de outra pessoa
            const userExists = await Users.findOne({ email });
            if (userExists && userExists.id !== userId) {
                return res.render('session/data_login', {
                    user: { id: userId, name, email }, // Mantém o que ele digitou
                    error: "Este e-mail já está sendo usado por outra pessoa."
                });
            }

            // Atualiza no banco
            await Users.update(userId, { name, email, password });

            // Atualiza o nome na sessão para refletir imediatamente na Sidebar
            req.session.userName = name;

            return res.redirect('/'); // Volta pra home após salvar
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            return res.render('session/data_login', { error: "Erro ao salvar as alterações." });
        }
    }
};