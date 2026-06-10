"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { updateUser } from "@/lib/actions/admin";
import { Select } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/constants";
import type { Profile, UserRole, UserStatus } from "@/lib/types";

const ROLES: UserRole[] = ["participant", "admin"];
const STATUSES: UserStatus[] = [
  "pending_payment",
  "active",
  "eliminated",
  "banned",
];

export function UserRow({ user }: { user: Profile }) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(
    user.role === "superadmin" ? "admin" : user.role,
  );
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(next: { role?: UserRole; status?: UserStatus }) {
    startTransition(async () => {
      await updateUser(user.user_id, next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.full_name ?? "—"}
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </TableCell>
      <TableCell>
        <Select
          value={role}
          className="w-40"
          onChange={(e) => {
            const v = e.target.value as UserRole;
            setRole(v);
            save({ role: v });
          }}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={status}
          className="w-44"
          onChange={(e) => {
            const v = e.target.value as UserStatus;
            setStatus(v);
            save({ status: v });
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {USER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </TableCell>
      <TableCell className="text-center">{user.total_points}</TableCell>
      <TableCell className="w-8">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : saved ? (
          <Check className="h-4 w-4 text-primary" />
        ) : null}
      </TableCell>
    </TableRow>
  );
}
