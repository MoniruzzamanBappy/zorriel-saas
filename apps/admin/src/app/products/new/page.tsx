import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

async function createProduct(form: FormData) {
  "use server";
  const res = await api("/products", {
    method: "POST",
    body: JSON.stringify({
      name: form.get("name"),
      unit: form.get("unit"),
      variants: [{ name: form.get("variant") || "Default", priceBdt: form.get("price"), stockQty: form.get("stock") || 0, barcode: form.get("barcode") || undefined }],
    }),
  });
  if (!res.ok) throw new Error("Could not save product");
  redirect("/");
}

export default function NewProduct() {
  return (
    <main className="mx-auto max-w-lg p-6">
      <Card>
        <h1 className="text-xl font-semibold mb-4">Add product</h1>
        <form action={createProduct} className="space-y-4">
          <div className="space-y-1"><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label htmlFor="variant">Variant</Label><Input id="variant" name="variant" placeholder="e.g. M / Blue" /></div>
            <div className="space-y-1">
              <Label htmlFor="unit">Unit</Label>
              <select id="unit" name="unit" className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm">
                {["piece", "kg", "gram", "litre", "packet", "dozen", "metre", "box"].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label htmlFor="price">Price (৳)</Label><Input id="price" name="price" type="number" step="0.01" min="0" required /></div>
            <div className="space-y-1"><Label htmlFor="stock">Opening stock</Label><Input id="stock" name="stock" type="number" step="0.001" min="0" /></div>
          </div>
          <div className="space-y-1"><Label htmlFor="barcode">Barcode</Label><Input id="barcode" name="barcode" /></div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Card>
    </main>
  );
}
