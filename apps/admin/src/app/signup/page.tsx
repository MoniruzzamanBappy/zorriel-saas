import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

const ROOT = process.env.ROOT_DOMAIN ?? "zorriel.localhost";

async function signup(form: FormData) {
  "use server";
  const res = await api<{ slug?: string; message?: string }>("/signup", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(form)),
  });
  if (!res.ok) redirect(`/signup?error=${encodeURIComponent(res.data?.message ?? "Signup failed")}`);
  const proto = ROOT.endsWith("localhost") ? "http" : "https";
  const port = ROOT.endsWith("localhost") ? ":3000" : "";
  redirect(`${proto}://${res.data.slug}.${ROOT}${port}/`);
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-md p-6">
      <Card>
        <h1 className="text-2xl font-semibold">Start your shop</h1>
        <p className="text-sm text-muted-foreground mb-6">Billing, stock and an online store. 14 days free.</p>
        {error && <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <form action={signup} className="space-y-4">
          <div className="space-y-1"><Label htmlFor="shopName">Shop name</Label><Input id="shopName" name="shopName" required /></div>
          <div className="space-y-1">
            <Label htmlFor="slug">Shop address</Label>
            <div className="flex items-center gap-2"><Input id="slug" name="slug" required pattern="[a-z0-9-]{3,32}" /><span className="text-sm text-muted-foreground">.{ROOT}</span></div>
          </div>
          <div className="space-y-1"><Label htmlFor="businessType">Business type</Label><Input id="businessType" name="businessType" placeholder="Clothing, grocery, rice..." /></div>
          <div className="space-y-1"><Label htmlFor="ownerName">Your name</Label><Input id="ownerName" name="ownerName" required /></div>
          <div className="space-y-1"><Label htmlFor="phone">Mobile number</Label><Input id="phone" name="phone" type="tel" placeholder="01XXXXXXXXX" required /></div>
          <Button type="submit" className="w-full">Create my shop</Button>
        </form>
      </Card>
    </main>
  );
}
