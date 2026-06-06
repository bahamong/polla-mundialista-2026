import { Navbar } from "@/components/navbar";
import { requireProfile } from "@/lib/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <main className="container animate-fade-in py-6">{children}</main>
    </div>
  );
}
