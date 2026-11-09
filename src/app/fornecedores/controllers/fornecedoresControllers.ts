import { Request, Response } from 'express';
// import Fornecedores from '../models/Fornecedores.js'; // Descomente no futuro

class FornecedoresControllers {

    async index(req: Request, res: Response) {
        try {
            // Renderiza o HTML que você salvou na pasta cad_funcionarios/pages
            // Lembre-se de ajustar a string 'cad_fornecedor' para bater com o ID do menu lateral, para que ele fique azul (ativo)
            return res.render('../../fornecedores/pages/index', {
                activeMenu: 'fornecedores' 
            });
        } catch (error) {
            console.error("Erro ao carregar módulo de fornecedores:", error);
            return res.status(500).send("Erro ao carregar a página.");
        }
    }

}

export default new FornecedoresControllers();