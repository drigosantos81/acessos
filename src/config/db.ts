import sqlite3 from 'sqlite3';

// Lembre-se de manter o SEU caminho completo aqui!
const dbPath = 'G:/Meu Drive/Relatórios/INDICADORES/DataBases/acessos.sqlite'; 

const sqliteDb = new sqlite3.Database(dbPath, (err: any) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
    } else {
        console.log('✅ Conectado ao banco SQLite com sucesso!');
        // Ativa as chaves estrangeiras
        sqliteDb.run('PRAGMA foreign_keys = ON;'); 
        // ATIVA O MODO DE ALTA CONCORRÊNCIA DO SQLITE
        sqliteDb.run('PRAGMA journal_mode = WAL;');
    }
});

const db = {
    query: (sql: string, params: any[] = []): Promise<any> => {
        return new Promise((resolve, reject) => {
            const sqliteSql = sql.replace(/\$\d+/g, '?');

            const isSelect = sqliteSql.trim().toUpperCase().startsWith('SELECT');
            // TRADUÇÃO: Verifica se é um INSERT/UPDATE que exige retorno de dados
            const isReturning = sqliteSql.toUpperCase().includes('RETURNING');

            if (isSelect || isReturning) {
                sqliteDb.all(sqliteSql, params, (err: any, rows: any) => {
                    if (err) {
                        console.error("❌ Erro na busca:", err.message, "\nSQL:", sqliteSql);
                        reject(err);
                    } else {
                        resolve({ rows: rows || [] }); 
                    }
                });
            } else {
                sqliteDb.run(sqliteSql, params, function (err: any) {
                    if (err) {
                        console.error("❌ Erro na gravação:", err.message, "\nSQL:", sqliteSql);
                        reject(err);
                    } else {
                        // @ts-ignore
                        resolve({ rowCount: this.changes, rows: [] }); 
                    }
                });
            }
        });
    }
};

export default db;