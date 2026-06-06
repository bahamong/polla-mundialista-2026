import { Badge } from "@/components/ui/badge";
import {
  USER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  MATCH_STATUS_LABELS,
} from "@/lib/constants";
import type { UserStatus, PaymentStatus, MatchStatus } from "@/lib/types";

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const variant =
    status === "active"
      ? "success"
      : status === "pending_payment"
        ? "warning"
        : status === "eliminated"
          ? "destructive"
          : "muted";
  return <Badge variant={variant}>{USER_STATUS_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const variant =
    status === "approved"
      ? "success"
      : status === "pending"
        ? "warning"
        : status === "rejected"
          ? "destructive"
          : "muted";
  return <Badge variant={variant}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const variant =
    status === "finished"
      ? "secondary"
      : status === "live"
        ? "success"
        : status === "scheduled"
          ? "muted"
          : "warning";
  return <Badge variant={variant}>{MATCH_STATUS_LABELS[status]}</Badge>;
}
