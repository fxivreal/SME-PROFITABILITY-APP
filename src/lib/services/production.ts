import { createClient, getCompanyId } from "@/lib/supabase";

export type CreateBatchData = {
  batch_number: string;
  production_date: string;
  finished_good_id: string;
  quantity_to_build: number;
  bom_id: string;
};

export type BatchFilters = {
  search?: string;
  finished_good_id?: string;
  date_from?: string;
  date_to?: string;
};

export async function getNextBatchNumber(): Promise<string> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("production_batches")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error("Failed to generate batch number");
  }

  return `BATCH-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function insertBatch(data: CreateBatchData) {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  const { data: batch, error } = await supabase
    .from("production_batches")
    .insert({
      company_id,
      batch_number: data.batch_number,
      production_date: data.production_date,
      finished_good_id: data.finished_good_id,
      quantity_to_build: data.quantity_to_build,
      bom_id: data.bom_id,
      status: "pending",
    })
    .select()
    .single();

  if (error || !batch) {
    throw new Error(error?.message ?? "Failed to create batch");
  }

  return batch;
}

export async function insertBatchMaterials(
  batchId: string,
  materials: { raw_material_id: string; quantity_used: number }[],
) {
  const supabase = await createClient();
  const company_id = await getCompanyId();
  const items = materials.map((m) => ({
    company_id,
    batch_id: batchId,
    raw_material_id: m.raw_material_id,
    quantity_used: m.quantity_used,
  }));

  const { error } = await supabase.from("batch_materials").insert(items);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteBatch(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("production_batches").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function completeBuildViaRPC(batchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_build", {
    p_batch_id: batchId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = data as { success: boolean; error?: string; total_material_cost?: number; cost_per_unit?: number };

  if (!result.success) {
    throw new Error(result.error ?? "Failed to complete build");
  }

  return result;
}

export async function getBatches(filters?: BatchFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("production_batches")
    .select("*, finished_goods!finished_good_id(name), bill_of_materials!bom_id(name)")
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.ilike("batch_number", `%${filters.search}%`);
  }
  if (filters?.finished_good_id) {
    query = query.eq("finished_good_id", filters.finished_good_id);
  }
  if (filters?.date_from) {
    query = query.gte("production_date", filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte("production_date", filters.date_to);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
