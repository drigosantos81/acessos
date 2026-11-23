import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// INF-01: Caminho resolvido dinamicamente via .env (fora da pasta public)
export const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads_privados');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

// SEC-03: Filtro de extensões e MIME types permitidos (PDF e Imagens)
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Envie apenas PDF, JPG ou PNG.'));
    }
};

// SEC-03: Limite de 5MB por arquivo
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

// SEC-03: Validação de assinatura real dos bytes (Magic Numbers) após o upload
export const validateMagicBytes = (req: Request, res: Response, next: NextFunction) => {
    const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const fileList: Express.Multer.File[] = [];

    if (req.file) fileList.push(req.file);
    if (filesObj) {
        Object.values(filesObj).forEach((arr) => fileList.push(...arr));
    }

    for (const file of fileList) {
        const buffer = Buffer.alloc(4);
        const fd = fs.openSync(file.path, 'r');
        fs.readSync(fd, buffer, 0, 4, 0);
        fs.closeSync(fd);

        const hex = buffer.toString('hex').toUpperCase();
        const isPdf = hex.startsWith('25504446'); // %PDF
        const isPng = hex.startsWith('89504E47'); // .PNG
        const isJpg = hex.startsWith('FFD8FF');   // JPEG

        if (!isPdf && !isPng && !isJpg) {
            // Remove o arquivo falsificado imediatamente do disco
            fs.unlinkSync(file.path);
            return res.status(400).send('Arquivo inválido ou corrompido (assinatura de arquivo não corresponde a PDF/Imagem).');
        }
    }

    return next();
};

// Exporta o middleware configurado com os campos exatos esperados pelo PagamentosControllers
export const uploadPagamentos = upload.fields([
    { name: 'anexo_boleto', maxCount: 1 },
    { name: 'anexo_nota_fatura', maxCount: 1 },
]);