-- Permite cadastrar tipos personalizados de ativos.
ALTER TABLE public.assets
  DROP CONSTRAINT IF EXISTS assets_asset_type_check;

ALTER TABLE public.assets
  DROP CONSTRAINT IF EXISTS assets_asset_type_not_empty_check;

ALTER TABLE public.assets
  ADD CONSTRAINT assets_asset_type_not_empty_check
  CHECK (length(btrim(asset_type)) > 0);