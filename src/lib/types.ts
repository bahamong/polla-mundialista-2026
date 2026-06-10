// =====================================================================
// Tipos del dominio — Polla Mundialista FIFA 2026
// =====================================================================

export type UserRole = "participant" | "admin" | "superadmin";
export type UserStatus = "pending_payment" | "active" | "eliminated" | "banned";
export type PaymentStatus = "pending" | "approved" | "rejected" | "refunded";
export type MatchStage =
  | "groups"
  | "round_32"
  | "round_16"
  | "quarter"
  | "semi"
  | "third_place"
  | "final";
export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "suspended"
  | "postponed";
export type PredictionResult = "home" | "draw" | "away";
export type PredictionStatus = "valid" | "locked" | "void";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  total_points: number;
  matches_played: number;
  hits: number;
  misses: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: PaymentStatus;
  payment_method: string | null;
  reference: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface TournamentGroup {
  id: string;
  letter: string;
  name: string | null;
}

export interface Team {
  id: string;
  name: string;
  country_code: string | null;
  flag_url: string | null;
  group_letter: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  fifa_match_number: number | null;
  stage: MatchStage;
  group_letter: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_placeholder: string | null;
  away_placeholder: string | null;
  match_datetime: string;
  bet_closes_at: string | null;
  stadium: string | null;
  city: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchWithTeams extends Match {
  home_team: Team | null;
  away_team: Team | null;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_result: PredictionResult;
  points_awarded: number;
  status: PredictionStatus;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface EliminationRule {
  id: string;
  stage: MatchStage;
  minimum_points: number;
  active: boolean;
  created_at: string;
}

export interface TournamentSetting {
  id: string;
  key: string;
  value: string | null;
  updated_at: string;
}

export interface LeaderboardRow {
  user_id: string;
  full_name: string | null;
  status: UserStatus;
  total_points: number;
  matches_played: number;
  hits: number;
  misses: number;
  position: number;
}

export interface PublicLeaderboardRow {
  position: number;
  full_name: string | null;
  total_points: number;
  matches_played: number;
  hits: number;
  status: UserStatus;
}

export interface TransparencyRow {
  full_name: string | null;
  user_id: string;
  fifa_match_number: number | null;
  stage: MatchStage;
  group_letter: string | null;
  home: string | null;
  away: string | null;
  match_datetime: string;
  match_status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  predicted_result: PredictionResult;
  points_awarded: number;
}
