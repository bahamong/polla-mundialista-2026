import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { TeamManager } from "@/components/admin/team-manager";
import type { Team } from "@/lib/types";

export default async function AdminTeamsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("*")
    .order("group_letter", { ascending: true })
    .order("name", { ascending: true });
  const teams = (data as Team[]) ?? [];

  return (
    <Card>
      <CardContent className="p-6">
        <TeamManager teams={teams} />
      </CardContent>
    </Card>
  );
}
