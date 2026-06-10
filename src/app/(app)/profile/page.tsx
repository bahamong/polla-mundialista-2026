import { getCurrentProfile } from "@/lib/queries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/profile-form";
import { UserStatusBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";

export default async function ProfilePage() {
  const profile = (await getCurrentProfile())!;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Datos personales</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{ROLE_LABELS[profile.role]}</Badge>
            <UserStatusBadge status={profile.status} />
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis estadísticas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">
              {profile.total_points}
            </p>
            <p className="text-xs text-muted-foreground">Puntos</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{profile.hits}</p>
            <p className="text-xs text-muted-foreground">Aciertos</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{profile.matches_played}</p>
            <p className="text-xs text-muted-foreground">Jugados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
