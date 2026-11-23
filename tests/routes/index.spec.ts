import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/server';

describe('Integração - Rotas Globais', () => {
  it('Deve responder corretamente na rota raiz (/)', async () => {
    const response = await request(app).get('/');
    expect([200, 302]).toContain(response.status);
  });

  it('Deve redirecionar (302) requisições não autenticadas, mesmo em rotas inexistentes', async () => {
    const response = await request(app).get('/rota-inexistente-123');

    // O middleware de sessão intercepta o acesso anônimo e redireciona para o login
    expect(response.status).toBe(302);

    // Podemos inclusive garantir que o redirecionamento aponta para a área de login
    // expect(response.header.location).toContain('/'); // Descomente e ajuste caso saiba a exata URL de login
  });
});