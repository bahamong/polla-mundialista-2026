import { getSettings } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsManager } from "@/components/admin/settings-manager";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del torneo</CardTitle>
      </CardHeader>
      <CardContent>
        <SettingsManager settings={settings} />
      </CardContent>
    </Card>
  );
}
