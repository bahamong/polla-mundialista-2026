import Link from "next/link";
import { requireAdmin } from "@/lib/queries";
import { AdminNav } from "@/components/admin/admin-nav";
import { Shield } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Panel de administración</h1>
      </div>
      <AdminNav />
      <div>{children}</div>
    </div>
  );
}
