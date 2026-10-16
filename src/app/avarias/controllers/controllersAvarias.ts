import { Request, Response } from 'express';

export default {
    index(req: Request, res: Response) {
        return res.render('index-avarias.html', {
            activeMenu: 'avarias' 
        });
    },

    // Renderiza formulário do funcionário
    formFuncionario(req: Request, res: Response) {
        return res.render('form-funcionario.html', { activeMenu: 'avarias' });
    },

    // Renderiza formulário do motorista
    formMotorista(req: Request, res: Response) {
        return res.render('form-motorista.html', { activeMenu: 'avarias' });
    }
};