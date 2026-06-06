import type {
  MatchStage,
  MatchStatus,
  PredictionResult,
  UserStatus,
  PaymentStatus,
} from "./types";

export const STAGE_LABELS: Record<MatchStage, string> = {
  groups: "Fase de grupos",
  round_32: "Dieciseisavos",
  round_16: "Octavos de final",
  quarter: "Cuartos de final",
  semi: "Semifinal",
  third_place: "Tercer puesto",
  final: "Final",
};

export const STAGE_ORDER: MatchStage[] = [
  "groups",
  "round_32",
  "round_16",
  "quarter",
  "semi",
  "third_place",
  "final",
];

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "Programado",
  live: "En juego",
  finished: "Finalizado",
  suspended: "Suspendido",
  postponed: "Aplazado",
};

export const PREDICTION_LABELS: Record<PredictionResult, string> = {
  home: "Gana Local",
  draw: "Empate",
  away: "Gana Visitante",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending_payment: "Pago pendiente",
  active: "Activo",
  eliminated: "Eliminado",
  banned: "Bloqueado",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  refunded: "Reembolsado",
};

export const GROUP_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
];
