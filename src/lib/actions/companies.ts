"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCompany(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name || name.trim().length === 0) {
    return { error: "Company name is required" };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("create_company_and_profile", {
    company_name: name.trim(),
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  redirect("/");
}
