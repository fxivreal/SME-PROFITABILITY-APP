import { createRawMaterial } from "@/lib/actions/raw-materials";
import { RawMaterialForm } from "@/components/raw-material-form";

export default function NewRawMaterialPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800">Add Raw Material</h2>
      <p className="text-gray-500 mt-1">Enter the details for the new raw material.</p>
      <RawMaterialForm action={createRawMaterial} />
    </div>
  );
}
