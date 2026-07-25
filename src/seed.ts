import bcrypt from 'bcryptjs';
import db from './config/db.js';

async function createSuperAdmin() {
    try {
        console.log("Iniciando criação do Super Admin...");

        // 1. Criptografa a senha '123456' com nível 8 de segurança
        const passwordHash = await bcrypt.hash('123456', 8);

        // 2. Prepara a query de inserção (is_admin = 1 para nível Admin)
        const query = `
            INSERT INTO users (name, email, password, is_admin)
            VALUES (?, ?, ?, ?)
        `;
        const values = [
            'Juliana Caldas',
            'juliana@tecon.com.br', 
            passwordHash,
            1 // 1 define que o usuário é Administrador
        ];

        // 3. Executa a inserção usando o método exato da sua configuração
        await db.query(query, values);

        console.log("✅ Super Admin (Juliana Caldas) criado com sucesso!");
        console.log("-----------------------------------");
        console.log("📧 E-mail: juliana@tecon.com.br");
        console.log("🔑 Senha:  123456");
        console.log("👑 Nível:  Administrador");
        console.log("-----------------------------------");

    } catch (error) {
        console.error("❌ Erro ao criar Super Admin:", error);
    }
}

createSuperAdmin();

// import bcrypt from 'bcryptjs';
// import db from './config/db.js'; // Caminho para o seu arquivo de banco!

// async function createSuperAdmin() {
//     try {
//         console.log("Iniciando criação do Super Admin...");

//         // 1. Criptografa a senha '123456' com nível 8 de segurança
//         const passwordHash = await bcrypt.hash('123456', 8);

//         // 2. Prepara a query de inserção (Note que is_admin vai como 1)
//         const query = `
//             INSERT INTO users (name, email, password, is_admin)
//             VALUES (?, ?, ?, ?)
//         `;
//         const values = [
//             'Juliana Caldas',
//             'juliana@tecon.com.br', // Você pode mudar o email que preferir
//             passwordHash,
//             0
//         ];

//         // 3. Executa a inserção no banco
//         await db.query(query, values);

//         console.log("✅ Juliana Caldas criado com sucesso!");
//         console.log("-----------------------------------");
//         console.log("📧 E-mail: juliana@tecon.com.br");
//         console.log("🔑 Senha:  123456");
//         console.log("-----------------------------------");

//     } catch (error) {
//         console.error("❌ Erro ao criar Juliana Caldas:", error);
//     }
// }

// createSuperAdmin();