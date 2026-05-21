PRAGMA foreign_keys = ON;

CREATE TABLE empresa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cnpj TEXT,
  cod_fornecedor INTEGER,
  nome_razao_social TEXT,
  situacao TEXT
);

CREATE UNIQUE INDEX empresa_cnpj_key ON empresa (cnpj);

CREATE TABLE adiantamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT,
  empresa_id INTEGER,
  valor REAL,
  solicitante TEXT,
  status TEXT,
  adt_fi INTEGER,
  data_solicitacao TEXT,
  data_aprovacao TEXT,
  data_pagamento TEXT,
  sla_atendimento INTEGER,
  cumpriu_sla INTEGER,
  FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);

CREATE TABLE centro_custo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);

CREATE UNIQUE INDEX centro_custo_empresa_id_codigo_key 
  ON centro_custo (empresa_id, codigo);

CREATE TABLE controle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER,
  data_lancamento TEXT,
  pedido TEXT,
  miro TEXT,
  valor REAL,
  matricula_remd TEXT,
  nota_fiscal TEXT,
  FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);

CREATE TABLE notas_fiscais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao TEXT,
  descricao TEXT,
  situacao TEXT,
  requisitante TEXT,
  servico_material TEXT,
  data_inicio TEXT,
  data_fim TEXT,
  sla_atendimento INTEGER,
  cumpriu_sla INTEGER,
  identificador TEXT,
  centro_custo_id INTEGER,
  data_nota TEXT,
  prioridade TEXT,
  empresa_id INTEGER,
  nota TEXT,
  pedido TEXT,
  valor REAL,
  FOREIGN KEY (centro_custo_id) REFERENCES centro_custo(id),
  FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);

CREATE TABLE notas_nao_escrituradas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER,
  nota TEXT,
  data_emissao TEXT,
  centro_custo_id INTEGER,
  FOREIGN KEY (empresa_id) REFERENCES empresa(id),
  FOREIGN KEY (centro_custo_id) REFERENCES centro_custo(id)
);

CREATE TABLE rc (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao TEXT,
  descricao TEXT,
  situacao TEXT,
  requisitante TEXT,
  centro_custo_id INTEGER,
  data_inicio TEXT,
  data_fim TEXT,
  sla_atendimento INTEGER,
  cumpriu_sla INTEGER,
  identificador TEXT,
  FOREIGN KEY (centro_custo_id) REFERENCES centro_custo(id)
);

CREATE TABLE reservas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitacao TEXT,
  descricao TEXT,
  situacao TEXT,
  requisitante TEXT,
  centro_custo_id INTEGER,
  data_inicio TEXT,
  data_fim TEXT,
  sla_atendimento INTEGER,
  cumpriu_sla INTEGER,
  identificador TEXT,
  FOREIGN KEY (centro_custo_id) REFERENCES centro_custo(id)
);

CREATE TABLE acesso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket TEXT,
  nome TEXT NOT NULL,
  numero_doc TEXT NOT NULL,
  doc_nacional TEXT NOT NULL,
  empresa TEXT,
  data_do_acesso TEXT NOT NULL,
  qtd_dias INTEGER NOT NULL,
  visita_a TEXT NOT NULL DEFAULT 'TECON SALVADOR',
  com_veiculo INTEGER NOT NULL,
  placa TEXT,
  tipo_veiculo TEXT,
  justificativa TEXT NOT NULL,
  portoes TEXT,
  autorizado TEXT,
  empresa_id INTEGER,
  centro_custo_id INTEGER,
  data_solicitacao TEXT,
  data_encerramento TEXT,
  updated_at TEXT,
  data_limite TEXT,
  telefone TEXT,
  tel_interno TEXT,
  FOREIGN KEY (empresa_id) REFERENCES empresa(id),
  FOREIGN KEY (centro_custo_id) REFERENCES centro_custo(id)
);
