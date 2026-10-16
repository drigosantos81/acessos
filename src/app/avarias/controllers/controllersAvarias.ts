import { Request, Response } from 'express';

export default {
    index(req: Request, res: Response) {
        return res.render('index-avarias.html', {
            activeMenu: 'avarias' 
        });
    }
};