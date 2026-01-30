-- Adicionar coluna password na tabela assets (senha do ativo/equipamento)
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS password TEXT;

COMMENT ON COLUMN assets.password IS 'Senha do equipamento/ativo para consulta interna';
