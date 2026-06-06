import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RulesManager } from "@/components/admin/rules-manager";
import type { EliminationRule } from "@/lib/types";

export default async function AdminRulesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("elimination_rules").select("*");
  const rules = (data as EliminationRule[]) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reglas de eliminación por fase</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Define el puntaje mínimo que un participante debe alcanzar al terminar
          cada fase. Aplica la eliminación desde el panel de Resumen.
        </p>
        <RulesManager rules={rules} />
      </CardContent>
    </Card>
  );
}
