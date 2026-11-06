import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Caminho absoluto apontando para fora do projeto
const uploadDir = 'C:/Users/remd/Documents/uploadscsc';

// Cria a pasta automaticamente se ela não existir
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Apenas os dois anexos que ficaram na tabela Pagamentos
export const uploadPagamentos = multer({ storage: storage }).fields([
    { name: 'anexo_nota_fatura', maxCount: 1 },
    { name: 'anexo_boleto', maxCount: 1 }
]);