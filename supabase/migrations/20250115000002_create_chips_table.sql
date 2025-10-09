-- Criar tabela de chips
CREATE TABLE IF NOT EXISTS chips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  company VARCHAR(50) NOT NULL CHECK (company IN ('Claro', 'Vivo')),
  department VARCHAR(100) NOT NULL,
  current_user_name VARCHAR(200) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
  plan VARCHAR(100) NOT NULL,
  monthly_cost DECIMAL(10,2) NOT NULL CHECK (monthly_cost >= 0),
  last_update DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(200),
  updated_by VARCHAR(200)
);

-- Criar tabela de histórico de chips
CREATE TABLE IF NOT EXISTS chip_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_id UUID REFERENCES chips(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(200)
);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_chips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chips_updated_at
  BEFORE UPDATE ON chips
  FOR EACH ROW
  EXECUTE FUNCTION update_chips_updated_at();

-- Inserir alguns dados de exemplo
INSERT INTO chips (
  phone_number, company, department, current_user_name, status, plan, monthly_cost, created_by
) VALUES 
  ('5511987654321', 'Claro', 'TI', 'João Silva', 'ativo', 'Controle 5GB', 49.90, 'Sistema'),
  ('5511912345678', 'Vivo', 'Comercial', 'Maria Souza', 'ativo', 'Pós 10GB', 99.90, 'Sistema'),
  ('5521998761234', 'Claro', 'Administrativo', 'Pedro Santos', 'inativo', 'Pré Pago', 0.00, 'Sistema'),
  ('5531911223344', 'Vivo', 'Operacional', 'Ana Costa', 'ativo', 'Controle 10GB', 69.90, 'Sistema'),
  ('5541955667788', 'Claro', 'TI', 'Carlos Lima', 'bloqueado', 'Empresarial', 79.90, 'Sistema')
ON CONFLICT (phone_number) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE chips IS 'Tabela para controle de chips de celular da empresa';
COMMENT ON COLUMN chips.phone_number IS 'Número do telefone do chip';
COMMENT ON COLUMN chips.company IS 'Operadora: Claro ou Vivo';
COMMENT ON COLUMN chips.department IS 'Departamento da empresa';
COMMENT ON COLUMN chips.current_user_name IS 'Nome do usuário atual do chip';
COMMENT ON COLUMN chips.status IS 'Status do chip: ativo, inativo, bloqueado';
COMMENT ON COLUMN chips.plan IS 'Plano contratado';
COMMENT ON COLUMN chips.monthly_cost IS 'Custo mensal do plano';
COMMENT ON COLUMN chips.last_update IS 'Data da última atualização';
