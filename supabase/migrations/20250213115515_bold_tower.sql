/*
  # Add delete policy for inventory items

  1. Security
    - Add policy to allow authenticated users to delete inventory items
*/

CREATE POLICY "Allow authenticated users to delete inventory items"
  ON inventory_items
  FOR DELETE
  TO authenticated
  USING (true);