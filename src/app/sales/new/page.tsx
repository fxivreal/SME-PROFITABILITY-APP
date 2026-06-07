import { supabase } from "@/lib/supabase";
import { createSale } from "@/lib/actions/sales";
import { SaleForm } from "@/components/sale-form";
import type { FinishedGood } from "@/lib/types";

export default async function NewSalePage() {
  const { data: products } = await supabase
    .from("finished_goods")
    .select("id, name, selling_price")
    .order("name");

  const items = (products ?? []) as Pick<FinishedGood, "id" | "name" | "selling_price">[];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800">Record Sale</h2>
      <p className="text-gray-500 mt-1">Select a product and enter the sale details.</p>
      <SaleForm action={createSale} products={items} />
    </div>
  );
}
