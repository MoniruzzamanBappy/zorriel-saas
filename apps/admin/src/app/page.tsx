import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Tenant = { slug: string; name: string; status: string };
type Product = { id: string; name: string; unit: string; variants: { id: string; name: string; priceBdt: string; stockQty: string }[] };

const bdt = (v: string) => `৳${Number(v).toLocaleString("en-BD")}`;

export default async function Dashboard() {
  const tenant = await api<Tenant>("/tenant");
  if (tenant.status === 404) notFound();
  const products = await api<Product[]>("/products");

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{tenant.data.name}</h1>
          <p className="text-sm text-muted-foreground">Status: {tenant.data.status}</p>
        </div>
        <Link href="/products/new" className={buttonVariants()}>Add product</Link>
      </header>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b border-border">
            <tr><th className="p-3">Product</th><th className="p-3">Variant</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Stock</th></tr>
          </thead>
          <tbody>
            {products.data.flatMap((p) => p.variants.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="p-3">{p.name}</td><td className="p-3">{v.name}</td>
                <td className="p-3 text-right">{bdt(v.priceBdt)}</td>
                <td className="p-3 text-right">{Number(v.stockQty)} {p.unit}</td>
              </tr>
            )))}
            {products.data.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No products yet. Add your first one.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
