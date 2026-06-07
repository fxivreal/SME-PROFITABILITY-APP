"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordSale } from "@/lib/services/sales";

export type SaleFormState = {
  errors?: {
    product_id?: string;
    quantity_sold?: string;
    selling_price?: string;
  };
  message?: string;
};

export async function createSale(
  _prevState: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  const productId = formData.get("product_id") as string;
  const quantitySold = formData.get("quantity_sold") as string;
  const sellingPrice = formData.get("selling_price") as string;
  const saleDate = formData.get("sale_date") as string;

  const errors: SaleFormState["errors"] = {};

  if (!productId) {
    errors.product_id = "Select a product";
  }
  if (!quantitySold || isNaN(Number(quantitySold)) || Number(quantitySold) <= 0) {
    errors.quantity_sold = "Must be a positive number";
  }
  if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0) {
    errors.selling_price = "Must be a non-negative number";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await recordSale({
      product_id: productId,
      quantity_sold: parseFloat(quantitySold),
      selling_price: parseFloat(sellingPrice),
      sale_date: saleDate || new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    return { message: err instanceof Error ? err.message : "Failed to record sale" };
  }

  revalidatePath("/sales");
  redirect("/sales");
}
