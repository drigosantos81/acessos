import { Request, Response } from 'express';
import Pagamentos from '../models/Pagamentos.js';
import { PagamentosTable } from '../interfaces/PagamentosTable.js';

class PagamentoControllers {
    async store(req: Request, res: Response) {
        try {
            const body = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            
            // Pega o nome do arquivo, se o usuário anexou
            const nomeBoleto = files && files['anexo_boleto'] ? files['anexo_boleto'][0].filename : null;
            const nomeNota = files && files['anexo_nota_fatura'] ? files['anexo_nota_fatura'][0].filename : null;

            let valorLimpo = 0;
            if (body.valor) {
                const stringValor = body.valor.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
                valorLimpo = parseFloat(stringValor);
            }

            const data: PagamentosTable = {
                user_id: req.session.userId!,
                setor: body.setor,
                tipo_documento: body.tipo_documento,
                contato_interno: body.contato_interno,
                pedido_compra: body.pedido_compra,
                cnpj_nota: body.cnpj_nota,
                razao_social: body.razao_social,
                numero_nota_fatura: body.numero_nota_fatura,
                data_emissao_nota: body.data_emissao_nota,
                data_vencimento: body.data_vencimento,
                valor: valorLimpo,
                tipo_pagamento: body.tipo_pagamento,
                servico_material_entregue: body.servico_material_entregue,
                mes_prestacao_servico: body.mes_prestacao_servico,
                status: 'SOLICITADO',
                anexo_boleto: nomeBoleto,
                anexo_nota_fatura: nomeNota
            };

            await Pagamentos.create(data);
            return res.redirect('/pagamentos');

        } catch (error) {
            console.error("Erro ao salvar pagamento:", error);
            return res.status(500).send("Erro ao salvar solicitação de pagamento.");
        }
    }
}
export default new PagamentoControllers();