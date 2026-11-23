/* =========================================================================
   MÓDULO DE ENVIO DE E-MAILS (Descomente quando tiver as credenciais SMTP)
   =========================================================================*/

import nodemailer from 'nodemailer';

// 1. Configuração do Servidor de E-mail (SMTP)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 2525,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// 2. Função genérica que servirá para Acessos, Avarias e Pagamentos
export async function sendStatusChangeEmail(toEmail: string, userName: string, ticket: string, newStatus: string, modulo: string) {
    try {
        const mailOptions = {
            from: '"Portal de Atendimento" <seu-email-de-envio@empresa.com.br>',
            to: toEmail,
            subject: `Atualização de Solicitação - ${modulo} (Ticket: ${ticket})`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h3 style="color: #011C43;">Olá, ${userName}!</h3>
                    <p>O status da sua solicitação de <strong>${modulo}</strong> (Ticket: <strong>${ticket}</strong>) foi alterado.</p>
                    <p>Novo Status: <strong style="color: #00BEDD; font-size: 16px;">${newStatus}</strong></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888;">Por favor, acesse o Portal de Atendimento para mais detalhes. Esta é uma mensagem automática, não responda este e-mail.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`E-mail enviado com sucesso para ${toEmail} sobre o ticket ${ticket}`);
    } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
    }
}