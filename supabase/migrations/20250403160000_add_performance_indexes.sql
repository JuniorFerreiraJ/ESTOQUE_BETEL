-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items (name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_department ON inventory_items (department_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items (category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_created ON inventory_items (created_at DESC);

-- Add indexes for inventory history
CREATE INDEX IF NOT EXISTS idx_inventory_history_item ON inventory_history (item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_history_department ON inventory_history (department_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created ON inventory_history (created_at DESC);

-- Add a function to clean up old history records
CREATE OR REPLACE FUNCTION cleanup_old_history() RETURNS void AS $$
BEGIN
    -- Delete history records older than 1 year
    DELETE FROM inventory_history
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup every month
SELECT cron.schedule(
    'cleanup-old-history',  -- name of the cron job
    '0 0 1 * *',           -- run at midnight on the first day of every month
    $$SELECT cleanup_old_history()$$
); 