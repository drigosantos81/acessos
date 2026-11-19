import { Router } from 'express';
import db from '../config/db.js';
import FrontControllers from '../app/acessos/controllers/FrontControllers.js';

const routes = Router();

// Páginas de Visualização Gerais
routes.get('/', FrontControllers.index);
routes.post('/', FrontControllers.post); // <-- Corrigido: Permite o envio do formulário na raiz
routes.get('/form', FrontControllers.createAcesso);
routes.post('/form', FrontControllers.post); // Mantido como garantia
routes.get('/resolvidos', FrontControllers.showResolved);
routes.get('/download-csv', FrontControllers.downloadCSV);

// APIs (Modal e Autocomplete)
routes.get('/api/search', FrontControllers.searchAutocomplete);
routes.get('/api/modal/:ticket', FrontControllers.getModalData);

// Painel Administrativo / Edição Massiva
routes.get('/admin/edit', FrontControllers.showEdit);
routes.post('/admin/update-massivo', FrontControllers.updateMassivo);

// Edição e Deleção Individual
routes.get('/admin/edit/:ticket', FrontControllers.showEditOne);
routes.get('/visualizar/:ticket', FrontControllers.showEditOne);
routes.post('/visualizar/:ticket', FrontControllers.updateEditOne);
routes.put('/visualizar/:ticket', FrontControllers.updateEditOne);
routes.post('/admin/edit/:ticket', FrontControllers.updateEditOne);
routes.post('/admin/delete/:ticket', FrontControllers.deleteEditOne);



// Rota GET para visualização do e-mail enviado ao solicitante
routes.get('/teste-email', async (req, res) => {
    try {
        // 1. Busca o ticket 98 real no banco de dados
        const query = "SELECT * FROM acesso WHERE ticket = ?";
        const results = await db.query(query, [98]);
        
        // 2. Extrai o registro (compatível com mysql2 ou sqlite)
        const acessoReal = Array.isArray(results) && results.length > 0 ? results[0] : (results?.rows ? results.rows[0] : null);

        if (!acessoReal) {
            return res.status(404).send("Ticket 98 não encontrado na base de dados.");
        }

        // 3. Formatação rápida das datas para o padrão brasileiro (DD/MM/YYYY) para ficar bonito no e-mail
        const formataData = (d: string) => {
            if (d && d.includes('-')) {
                const dataSplit = d.split(' ')[0].split('-');
                if (dataSplit.length === 3) {
                    return `${dataSplit[2]}/${dataSplit[1]}/${dataSplit[0]}`;
                }
            }
            return d;
        };

        acessoReal.data_do_acesso = formataData(acessoReal.data_do_acesso);
        acessoReal.data_limite = formataData(acessoReal.data_limite);

        // 4. Renderiza o HTML passando os dados reais do banco
        return res.render('../../acessos/pages/emails/template_email.html', {
            solicitante: "Rodrigo Emanuel", // Aqui você é o solicitante recebendo a notificação
            acesso: acessoReal
        });

    } catch (error) {
        console.error("Erro ao gerar e-mail de teste:", error);
        return res.status(500).send("Erro ao carregar os dados reais do banco.");
    }
});

export default routes;