ALTER TABLE production_batches RENAME COLUMN output_product_id TO finished_good_id;
ALTER TABLE production_batches RENAME COLUMN output_quantity TO quantity_to_build;

ALTER TABLE production_batches DROP CONSTRAINT IF EXISTS production_batches_status_check;
ALTER TABLE production_batches ADD CONSTRAINT production_batches_status_check
  CHECK (status IN ('pending', 'completed'));
