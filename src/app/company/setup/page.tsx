import { createClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { createCompany } from "@/lib/actions/companies";
import CompanySetupForm from "./form";

export default async function CompanySetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2 text-center">Create Your Company</h1>
        <p className="text-gray-600 text-sm mb-6 text-center">
          Enter your company name to get started.
        </p>
        <CompanySetupForm />
      </div>
    </div>
  );
}
