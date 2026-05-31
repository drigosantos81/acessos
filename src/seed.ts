import bcrypt from 'bcryptjs';
import db from './config/db.js'; // Confirme se esse é o caminho correto para o seu arquivo de banco!

async function createSuperAdmin() {
    try {
        console.log("Iniciando criação do Super Admin...");

        // 1. Criptografa a senha '123456' com nível 8 de segurança
        const passwordHash = await bcrypt.hash('123456', 8);

        // 2. Prepara a query de inserção (Note que is_admin vai como 1)
        const query = `
            INSERT INTO users (name, email, password, is_admin)
            VALUES (?, ?, ?, ?)
        `;
        const values = [
            'Anderson Santos',
            'anderson.santos@wilsonsons.com.br', // Você pode mudar o email que preferir
            passwordHash,
            0
        ];

        // 3. Executa a inserção no banco
        await db.query(query, values);

        console.log("✅ Super Admin criado com sucesso!");
        console.log("-----------------------------------");
        console.log("📧 E-mail: admin@tecon.com.br");
        console.log("🔑 Senha:  123456");
        console.log("-----------------------------------");

    } catch (error) {
        console.error("❌ Erro ao criar Super Admin:", error);
    }
}

createSuperAdmin();