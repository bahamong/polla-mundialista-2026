"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, Plus } from "lucide-react";
import { upsertTeam, deleteTeam } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { GROUP_LETTERS } from "@/lib/constants";
import type { Team } from "@/lib/types";

function flagFromCode(code: string) {
  return code ? `https://flagcdn.com/${code.toLowerCase()}.svg` : "";
}

function TeamEditor({ team }: { team: Team }) {
  const router = useRouter();
  const [name, setName] = useState(team.name);
  const [code, setCode] = useState(team.country_code ?? "");
  const [group, setGroup] = useState(team.group_letter ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await upsertTeam({
        id: team.id,
        name,
        country_code: code,
        flag_url: flagFromCode(code),
        group_letter: group || null,
      });
      router.refresh();
    });
  }
  function remove() {
    if (!confirm(`¿Eliminar a ${team.name}?`)) return;
    startTransition(async () => {
      await deleteTeam(team.id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flagFromCode(code)}
        alt={name}
        className="h-5 w-7 rounded-sm object-cover ring-1 ring-border"
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 w-40"
      />
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="código (mx)"
        className="h-8 w-24"
      />
      <Select
        value={group}
        onChange={(e) => setGroup(e.target.value)}
        className="h-8 w-24"
      >
        <option value="">Sin grupo</option>
        {GROUP_LETTERS.map((g) => (
          <option key={g} value={g}>
            Grupo {g}
          </option>
        ))}
      </Select>
      <Button size="sm" variant="secondary" onClick={save} disabled={isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={remove}
        disabled={isPending}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function TeamManager({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [group, setGroup] = useState("");
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!name) return;
    startTransition(async () => {
      await upsertTeam({
        name,
        country_code: code,
        flag_url: flagFromCode(code),
        group_letter: group || null,
      });
      setName("");
      setCode("");
      setGroup("");
      router.refresh();
    });
  }

  const byGroup: Record<string, Team[]> = {};
  for (const t of teams) {
    const k = t.group_letter ?? "Sin grupo";
    (byGroup[k] ||= []).push(t);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
        <Plus className="h-4 w-4 text-primary" />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del equipo"
          className="h-8 w-44"
        />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="código (mx)"
          className="h-8 w-24"
        />
        <Select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="h-8 w-28"
        >
          <option value="">Sin grupo</option>
          {GROUP_LETTERS.map((g) => (
            <option key={g} value={g}>
              Grupo {g}
            </option>
          ))}
        </Select>
        <Button size="sm" onClick={add} disabled={isPending || !name}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Agregar"
          )}
        </Button>
      </div>

      {Object.keys(byGroup)
        .sort()
        .map((g) => (
          <div key={g} className="space-y-2">
            <h3 className="text-sm font-semibold">
              {g === "Sin grupo" ? g : `Grupo ${g}`}
            </h3>
            <div className="space-y-2">
              {byGroup[g].map((t) => (
                <TeamEditor key={t.id} team={t} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
