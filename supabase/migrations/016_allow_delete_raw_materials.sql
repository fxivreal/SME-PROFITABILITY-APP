-- Allow deleting raw materials used in production history
-- Changes batch_materials.raw_material_id FK to ON DELETE SET NULL
-- So deleting a raw material preserves batch records (just severs the link)

ALTER TABLE batch_materials
  DROP CONSTRAINT IF EXISTS batch_materials_raw_material_id_fkey,
  ALTER COLUMN raw_material_id DROP NOT NULL,
  ADD CONSTRAINT batch_materials_raw_material_id_fkey
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
    ON DELETE SET NULL;

-- Update the complete_build function to handle null raw_material_id
CREATE OR REPLACE FUNCTION complete_build(p_batch_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_batch RECORD;
  v_rm RECORD;
  v_total_cost DECIMAL(12,2) := 0;
  v_cost_per_unit DECIMAL(12,2) := 0;
BEGIN
  SELECT * INTO v_batch FROM production_batches WHERE id = p_batch_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Batch not found');
  END IF;

  IF v_batch.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot complete a batch with status "' || v_batch.status || '"');
  END IF;

  FOR v_rm IN
    SELECT bm.quantity_used, rm.id AS rm_id, rm.name, rm.quantity_in_stock, rm.cost_per_unit
    FROM batch_materials bm
    LEFT JOIN raw_materials rm ON rm.id = bm.raw_material_id
    WHERE bm.batch_id = p_batch_id
    FOR UPDATE OF rm
  LOOP
    IF v_rm.rm_id IS NULL THEN
      CONTINUE;
    END IF;

    IF v_rm.quantity_in_stock < v_rm.quantity_used THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Insufficient stock of "%s". Available: %s, Required: %s', v_rm.name, v_rm.quantity_in_stock, v_rm.quantity_used)
      );
    END IF;

    UPDATE raw_materials SET quantity_in_stock = quantity_in_stock - v_rm.quantity_used
    WHERE id = v_rm.rm_id;

    v_total_cost := v_total_cost + (v_rm.quantity_used * v_rm.cost_per_unit);
  END LOOP;

  v_cost_per_unit := v_total_cost / v_batch.quantity_to_build;

  UPDATE finished_goods
  SET quantity_in_stock = quantity_in_stock + v_batch.quantity_to_build,
      cost_per_unit = v_cost_per_unit
  WHERE id = v_batch.finished_good_id;

  UPDATE production_batches
  SET status = 'completed',
      total_material_cost = v_total_cost,
      cost_per_unit = v_cost_per_unit
  WHERE id = p_batch_id;

  RETURN jsonb_build_object('success', true, 'total_material_cost', v_total_cost, 'cost_per_unit', v_cost_per_unit);
END;
$$;
