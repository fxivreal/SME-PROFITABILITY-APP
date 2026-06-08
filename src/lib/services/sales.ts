import { createClient } from "@/lib/supabase";

export type RecordSaleData = {
  product_id: string;
  quantity_sold: number;
  selling_price: number;
  sale_date: string;
};

export async function recordSale(data: RecordSaleData) {
  const supabase = await createClient();
  const { data: product, error: fetchError } = await supabase
    .from("finished_goods")
    .select("id, quantity_in_stock")
    .eq("id", data.product_id)
    .single();

  if (fetchError || !product) {
    throw new Error("Finished good not found");
  }

  if (product.quantity_in_stock < data.quantity_sold) {
    throw new Error(
      `Insufficient stock. Available: ${product.quantity_in_stock}, Required: ${data.quantity_sold}`,
    );
  }

  const { error: insertError } = await supabase.from("sales").insert({
    product_id: data.product_id,
    quantity_sold: data.quantity_sold,
    selling_price: data.selling_price,
    sale_date: data.sale_date,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: updateError } = await supabase
    .from("finished_goods")
    .update({ quantity_in_stock: product.quantity_in_stock - data.quantity_sold })
    .eq("id", data.product_id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export type SaleFilters = {
  product_id?: string;
  date_from?: string;
  date_to?: string;
};

export async function getSales(filters?: SaleFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("sales")
    .select("*, finished_goods!product_id(name)")
    .order("sale_date", { ascending: false });

  if (filters?.product_id) {
    query = query.eq("product_id", filters.product_id);
  }
  if (filters?.date_from) {
    query = query.gte("sale_date", filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte("sale_date", filters.date_to);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
