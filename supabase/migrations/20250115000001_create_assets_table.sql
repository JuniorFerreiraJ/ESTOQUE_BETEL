-- Criar tabela de ativos
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('notebook', 'celular', 'tablet', 'outros')),
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  serial_number VARCHAR(200) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  current_user VARCHAR(200) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('ativo', 'inativo', 'manutencao', 'fora_uso')),
  delivery_date DATE NOT NULL,
  purchase_value DECIMAL(10,2) NOT NULL CHECK (purchase_value >= 0),
  warranty_expiry DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(200),
  updated_by VARCHAR(200)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_assets_current_user ON assets(current_user);
CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_warranty_expiry ON assets(warranty_expiry);

-- Criar tabela de histórico de ativos
CREATE TABLE IF NOT EXISTS asset_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'assigned', 'unassigned', 'maintenance', 'lost', 'found')),
  old_values JSONB,
  new_values JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(200) NOT NULL
);

-- Criar índice para histórico
CREATE INDEX IF NOT EXISTS idx_asset_history_asset_id ON asset_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_created_at ON asset_history(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON assets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - por enquanto desabilitado para desenvolvimento
-- ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;

-- Inserir alguns dados de exemplo (usando departamentos existentes)
-- Nota: Os departamentos devem existir na tabela 'departments' antes de executar este INSERT
INSERT INTO assets (
  asset_type, brand, model, serial_number, department, current_user_name, 
  status, delivery_date, purchase_value, warranty_expiry, created_by
) VALUES 
  ('notebook', 'Dell', 'Inspiron 15 3000', 'DL123456789', 'TI', 'João Silva', 
   'ativo', '2023-01-15', 2500.00, '2025-01-15', 'Sistema'),
  ('celular', 'Samsung', 'Galaxy A54', 'SM987654321', 'Comercial', 'Maria Souza', 
   'ativo', '2023-06-10', 1200.00, '2024-06-10', 'Sistema'),
  ('notebook', 'Lenovo', 'ThinkPad E15', 'LN456789123', 'Administrativo', 'Pedro Santos', 
   'ativo', '2022-11-20', 3200.00, '2024-11-20', 'Sistema'),
  ('tablet', 'iPad', 'Air 5', 'IP789123456', 'Operacional', 'Ana Costa', 
   'manutencao', '2023-03-05', 1800.00, '2025-03-05', 'Sistema'),
  ('celular', 'iPhone', '13', 'IP123789456', 'TI', 'Carlos Lima', 
   'fora_uso', '2022-08-15', 3500.00, '2024-08-15', 'Sistema')
ON CONFLICT (serial_number) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE assets IS 'Tabela para controle de ativos da empresa';
COMMENT ON COLUMN assets.asset_type IS 'Tipo do ativo: notebook, celular, tablet, outros';
COMMENT ON COLUMN assets.serial_number IS 'Número de série único do equipamento';
COMMENT ON COLUMN assets.status IS 'Status atual: ativo, inativo, manutencao, perdido';
COMMENT ON COLUMN assets.warranty_expiry IS 'Data de vencimento da garantia';

COMMENT ON TABLE asset_history IS 'Histórico de mudanças nos ativos';
COMMENT ON COLUMN asset_history.action IS 'Tipo de ação realizada';
COMMENT ON COLUMN asset_history.old_values IS 'Valores anteriores (JSON)';
COMMENT ON COLUMN asset_history.new_values IS 'Novos valores (JSON)';
