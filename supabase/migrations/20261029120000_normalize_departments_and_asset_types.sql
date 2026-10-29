-- Evita departamentos duplicados por espaços ou diferenças de maiúsculas/minúsculas.
WITH normalized AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER (
      PARTITION BY lower(regexp_replace(btrim(name), '\\s+', ' ', 'g'))
      ORDER BY id
    ) AS keep_id
  FROM departments
), duplicates AS (
  SELECT id, keep_id
  FROM normalized
  WHERE id <> keep_id
)
UPDATE inventory_items AS items
SET department_id = duplicates.keep_id
FROM duplicates
WHERE items.department_id = duplicates.id;

WITH normalized AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER (
      PARTITION BY lower(regexp_replace(btrim(name), '\\s+', ' ', 'g'))
      ORDER BY id
    ) AS keep_id
  FROM departments
)
DELETE FROM departments
WHERE id IN (
  SELECT id
  FROM normalized
  WHERE id <> keep_id
);

UPDATE departments
SET name = upper(regexp_replace(btrim(name), '\s+', ' ', 'g'));

CREATE UNIQUE INDEX IF NOT EXISTS departments_name_normalized_unique
  ON departments (lower(btrim(name)));

-- Os tipos personalizados passam a ser aceitos pelo cadastro de ativos.
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_asset_type_check;
ALTER TABLE assets
  ADD CONSTRAINT assets_asset_type_not_empty_check
  CHECK (length(btrim(asset_type)) > 0);