import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import Pagamentos from '../../src/app/pagamentos/models/Pagamentos.js';
import db from '../../src/config/db.js';

describe('Lógica de Negócio - Módulo Pagamentos', () => {
  let querySpy: any;

  beforeEach(() => {
    // Intercepta db.query diretamente, simulando o retorno sem alterar o banco real
    querySpy = jest.spyOn(db, 'query').mockImplementation(async () => ({ changes: 1 }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Mecânica "Assumir Tarefa"', () => {
    it('Deve executar a query correta atualizando o status para "EM ANÁLISE" e vinculando o admin_id', async () => {
      const ticketId = 1;
      const adminId = 99;

      await Pagamentos.assumirTarefa(ticketId, adminId);

      expect(querySpy).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'EM ANÁLISE', admin_id = ?"),
        [adminId, ticketId]
      );
    });
  });

  describe('Desbloqueio Seletivo (Checkboxes)', () => {
    it('Deve executar a query correta alterando status para "PENDENTE" e registrando campos_pendentes', async () => {
      const ticketId = 2;
      const camposDesbloqueio = 'empresa_id, valor';

      await Pagamentos.devolverTarefaPendente(ticketId, camposDesbloqueio);

      expect(querySpy).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'PENDENTE', campos_pendentes = ?"),
        [camposDesbloqueio, ticketId]
      );
    });
  });
});