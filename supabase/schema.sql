-- =====================================================================
-- POLLA MUNDIALISTA FIFA WORLD CUP 2026 — ESQUEMA COMPLETO
-- Ejecuta este archivo en el SQL Editor de un proyecto Supabase nuevo
-- (o vía `supabase db push`). Luego ejecuta seed.sql para datos iniciales.
-- =====================================================================

-- ---------- ENUMS ----------
do $$ begin create type pm_user_role as enum ('participant','admin','superadmin'); exception when duplicate_object then null; end $$;
do $$ begin create type pm_user_status as enum ('pending_payment','active','eliminated','banned'); exception when duplicate_object then null; end $$;
do $$ begin create type pm_payment_status as enum ('pending','approved','rejected','refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type pm_match_stage as enum ('groups','round_32','round_16','quarter','semi','third_place','final'); exception when duplicate_object then null; end $$;
do $$ begin create type pm_match_status as enum ('scheduled','live','finished','suspended','postponed'); exception when duplicate_object then null; end $$;
do $$ begin create type pm_prediction_result as enum ('home','draw','away'); exception when duplicate_object then null; end $$;
do $$ begin create type pm_prediction_status as enum ('valid','locked','void'); exception when duplicate_object then null; end $$;

-- ---------- TABLES ----------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text, email text,
  role pm_user_role not null default 'participant',
  status pm_user_status not null default 'pending_payment',
  total_points int not null default 0,
  matches_played int not null default 0,
  hits int not null default 0,
  misses int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_groups (
  id uuid primary key default gen_random_uuid(),
  letter text not null unique,
  name text
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text,
  flag_url text,
  group_letter text references public.tournament_groups(letter) on update cascade on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  amount numeric(12,2) not null default 0,
  status pm_payment_status not null default 'pending',
  payment_method text, reference text,
  approved_by uuid references public.profiles(user_id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  fifa_match_number int unique,
  stage pm_match_stage not null default 'groups',
  group_letter text references public.tournament_groups(letter) on update cascade on delete set null,
  home_team_id uuid references public.teams(id) on delete set null,
  away_team_id uuid references public.teams(id) on delete set null,
  home_placeholder text, away_placeholder text,
  match_datetime timestamptz not null,
  bet_closes_at timestamptz,
  stadium text, city text,
  status pm_match_status not null default 'scheduled',
  home_score int, away_score int,
  winner_team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_result pm_prediction_result not null,
  points_awarded int not null default 0,
  status pm_prediction_status not null default 'valid',
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create table if not exists public.elimination_rules (
  id uuid primary key default gen_random_uuid(),
  stage pm_match_stage not null unique,
  minimum_points int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tournament_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  updated_at timestamptz not null default now()
);

-- ---------- INDEXES ----------
create index if not exists idx_profiles_role     on public.profiles(role);
create index if not exists idx_profiles_status   on public.profiles(status);
create index if not exists idx_payments_user     on public.payments(user_id);
create index if not exists idx_payments_status   on public.payments(status);
create index if not exists idx_teams_group       on public.teams(group_letter);
create index if not exists idx_matches_stage     on public.matches(stage);
create index if not exists idx_matches_datetime  on public.matches(match_datetime);
create index if not exists idx_matches_status    on public.matches(status);
create index if not exists idx_predictions_user  on public.predictions(user_id);
create index if not exists idx_predictions_match on public.predictions(match_id);

-- =====================================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================================
create or replace function public.pm_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.pm_set_bet_closes_at()
returns trigger language plpgsql set search_path = public as $$
begin new.bet_closes_at := new.match_datetime - interval '1 hour'; return new; end $$;

create or replace function public.pm_is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = uid and role in ('admin','superadmin'));
$$;

create or replace function public.pm_is_active_participant(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = uid and status = 'active');
$$;

create or replace function public.pm_can_bet_on_match(p_match_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match_id and now() < m.bet_closes_at
      and m.status = 'scheduled'
      and m.home_team_id is not null and m.away_team_id is not null
  );
$$;

-- Crear perfil al registrarse; el primer usuario se vuelve superadmin.
create or replace function public.pm_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_has_admin boolean;
  v_role pm_user_role := 'participant';
  v_status pm_user_status := 'pending_payment';
begin
  select exists (select 1 from public.profiles where role in ('admin','superadmin')) into v_has_admin;
  if not v_has_admin then v_role := 'admin'; v_status := 'active'; end if;
  insert into public.profiles (user_id, full_name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email, v_role, v_status
  ) on conflict (user_id) do nothing;
  return new;
end $$;

create or replace function public.pm_protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.pm_is_admin(auth.uid()) then
    new.role := old.role; new.status := old.status;
  end if;
  return new;
end $$;

create or replace function public.pm_set_match_winner()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'finished' and new.home_score is not null and new.away_score is not null then
    if new.home_score > new.away_score then new.winner_team_id := new.home_team_id;
    elsif new.home_score < new.away_score then new.winner_team_id := new.away_team_id;
    else new.winner_team_id := null; end if;
  elsif new.status <> 'finished' then
    new.winner_team_id := null;
  end if;
  return new;
end $$;

create or replace function public.pm_recompute_match_predictions(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m public.matches%rowtype; v_res text; v_pts int;
begin
  select * into m from public.matches where id = p_match_id;
  if not found then return; end if;
  select coalesce(max((value)::int), 1) into v_pts from public.tournament_settings where key = 'points_per_correct';
  if v_pts is null then v_pts := 1; end if;

  if m.status = 'finished' and m.home_score is not null and m.away_score is not null then
    v_res := case when m.home_score > m.away_score then 'home'
                  when m.home_score < m.away_score then 'away' else 'draw' end;
    update public.predictions
      set points_awarded = case when predicted_result::text = v_res then v_pts else 0 end,
          locked = true, status = 'locked'::pm_prediction_status, updated_at = now()
    where match_id = p_match_id;
  else
    update public.predictions
      set points_awarded = 0,
          locked = (now() >= m.bet_closes_at),
          status = (case when now() >= m.bet_closes_at then 'locked' else 'valid' end)::pm_prediction_status,
          updated_at = now()
    where match_id = p_match_id;
  end if;

  update public.profiles p set
      total_points = s.tp, matches_played = s.mp, hits = s.h, misses = s.ms
  from (
    select pr.user_id,
           coalesce(sum(pr.points_awarded),0) as tp,
           count(*) filter (where pr.locked) as mp,
           count(*) filter (where pr.points_awarded > 0) as h,
           count(*) filter (where pr.locked and pr.points_awarded = 0) as ms
    from public.predictions pr
    where pr.user_id in (select user_id from public.predictions where match_id = p_match_id)
    group by pr.user_id
  ) s
  where p.user_id = s.user_id;
end $$;

-- Avance automático de llaves según placeholders 'Ganador P##' / 'Perdedor P##'
create or replace function public.pm_propagate_bracket(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m public.matches%rowtype; v_winner uuid; v_loser uuid; v_tag_w text; v_tag_l text;
begin
  select * into m from public.matches where id = p_match_id;
  if not found then return; end if;
  if m.stage = 'groups' or m.fifa_match_number is null then return; end if;
  v_tag_w := 'Ganador Partido '  || m.fifa_match_number;
  v_tag_l := 'Perdedor Partido ' || m.fifa_match_number;

  if m.status = 'finished' and m.winner_team_id is not null then
    v_winner := m.winner_team_id;
    v_loser  := case when m.winner_team_id = m.home_team_id then m.away_team_id
                     when m.winner_team_id = m.away_team_id then m.home_team_id
                     else null end;
    update public.matches set home_team_id = v_winner where home_placeholder = v_tag_w and home_team_id is distinct from v_winner;
    update public.matches set away_team_id = v_winner where away_placeholder = v_tag_w and away_team_id is distinct from v_winner;
    if v_loser is not null then
      update public.matches set home_team_id = v_loser where home_placeholder = v_tag_l and home_team_id is distinct from v_loser;
      update public.matches set away_team_id = v_loser where away_placeholder = v_tag_l and away_team_id is distinct from v_loser;
    end if;
  else
    update public.matches set home_team_id = null where home_placeholder = v_tag_w and status = 'scheduled';
    update public.matches set away_team_id = null where away_placeholder = v_tag_w and status = 'scheduled';
    update public.matches set home_team_id = null where home_placeholder = v_tag_l and status = 'scheduled';
    update public.matches set away_team_id = null where away_placeholder = v_tag_l and status = 'scheduled';
  end if;
end $$;

create or replace function public.pm_after_match_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.pm_recompute_match_predictions(new.id);
  perform public.pm_propagate_bracket(new.id);
  return new;
end $$;

create or replace function public.pm_after_payment_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    if new.approved_at is null then new.approved_at := now(); end if;
    update public.profiles set status = 'active', updated_at = now()
    where user_id = new.user_id and status = 'pending_payment';
  end if;
  return new;
end $$;

create or replace function public.pm_recalculate_all()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if not public.pm_is_admin(auth.uid()) then raise exception 'No autorizado'; end if;
  for r in select id from public.matches loop
    perform public.pm_recompute_match_predictions(r.id);
  end loop;
end $$;

create or replace function public.pm_apply_elimination(p_stage pm_match_stage)
returns int language plpgsql security definer set search_path = public as $$
declare v_min int; v_count int;
begin
  if not public.pm_is_admin(auth.uid()) then raise exception 'No autorizado'; end if;
  select minimum_points into v_min from public.elimination_rules where stage = p_stage and active = true;
  if v_min is null then return 0; end if;
  with totals as (
    select pr.user_id, coalesce(sum(pr.points_awarded),0) as pts
    from public.predictions pr group by pr.user_id
  )
  update public.profiles p set status = 'eliminated', updated_at = now()
  from totals t
  where p.user_id = t.user_id and p.role = 'participant'
    and p.status = 'active' and t.pts < v_min;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

create or replace function public.pm_public_leaderboard()
returns table("position" bigint, full_name text, total_points int, matches_played int, hits int, status pm_user_status)
language sql stable security definer set search_path = public as $$
  select rank() over (order by total_points desc, hits desc) as position,
         full_name, total_points, matches_played, hits, status
  from public.profiles where role = 'participant' and status = 'active'
  order by total_points desc, hits desc;
$$;

-- ---------- TRIGGERS ----------
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.pm_set_updated_at();
drop trigger if exists trg_matches_updated on public.matches;
create trigger trg_matches_updated before update on public.matches for each row execute function public.pm_set_updated_at();
drop trigger if exists trg_predictions_updated on public.predictions;
create trigger trg_predictions_updated before update on public.predictions for each row execute function public.pm_set_updated_at();

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created after insert on auth.users for each row execute function public.pm_handle_new_user();

drop trigger if exists trg_protect_profile on public.profiles;
create trigger trg_protect_profile before update on public.profiles for each row execute function public.pm_protect_profile_fields();

drop trigger if exists trg_bet_closes on public.matches;
create trigger trg_bet_closes before insert or update of match_datetime on public.matches for each row execute function public.pm_set_bet_closes_at();

drop trigger if exists trg_set_winner on public.matches;
create trigger trg_set_winner before insert or update on public.matches for each row execute function public.pm_set_match_winner();

drop trigger if exists trg_after_match_change on public.matches;
create trigger trg_after_match_change after update of status, home_score, away_score on public.matches for each row execute function public.pm_after_match_change();

drop trigger if exists trg_after_payment_change on public.payments;
create trigger trg_after_payment_change before update on public.payments for each row execute function public.pm_after_payment_change();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.teams enable row level security;
alter table public.tournament_groups enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.elimination_rules enable row level security;
alter table public.tournament_settings enable row level security;

-- profiles
-- Lectura de profiles: solo el propio perfil o admin (no expone email/teléfono).
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (user_id = auth.uid() or public.pm_is_admin(auth.uid()));
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated with check (user_id = auth.uid());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (user_id = auth.uid() or public.pm_is_admin(auth.uid()))
  with check (user_id = auth.uid() or public.pm_is_admin(auth.uid()));
drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles for delete to authenticated using (public.pm_is_admin(auth.uid()));

-- payments
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select to authenticated using (user_id = auth.uid() or public.pm_is_admin(auth.uid()));
drop policy if exists payments_insert_self on public.payments;
create policy payments_insert_self on public.payments for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
drop policy if exists payments_admin_update on public.payments;
create policy payments_admin_update on public.payments for update to authenticated using (public.pm_is_admin(auth.uid())) with check (public.pm_is_admin(auth.uid()));
drop policy if exists payments_admin_delete on public.payments;
create policy payments_admin_delete on public.payments for delete to authenticated using (public.pm_is_admin(auth.uid()));

-- teams / groups / matches / settings (lectura pública)
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams for select to anon, authenticated using (true);
drop policy if exists teams_admin_write on public.teams;
create policy teams_admin_write on public.teams for all to authenticated using (public.pm_is_admin(auth.uid())) with check (public.pm_is_admin(auth.uid()));

drop policy if exists groups_select on public.tournament_groups;
create policy groups_select on public.tournament_groups for select to anon, authenticated using (true);
drop policy if exists groups_admin_write on public.tournament_groups;
create policy groups_admin_write on public.tournament_groups for all to authenticated using (public.pm_is_admin(auth.uid())) with check (public.pm_is_admin(auth.uid()));

drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches for select to anon, authenticated using (true);
drop policy if exists matches_admin_write on public.matches;
create policy matches_admin_write on public.matches for all to authenticated using (public.pm_is_admin(auth.uid())) with check (public.pm_is_admin(auth.uid()));

drop policy if exists settings_select on public.tournament_settings;
create policy settings_select on public.tournament_settings for select to anon, authenticated using (true);
drop policy if exists settings_admin_write on public.tournament_settings;
create policy settings_admin_write on public.tournament_settings for all to authenticated using (public.pm_is_admin(auth.uid())) with check (public.pm_is_admin(auth.uid()));

-- elimination_rules
drop policy if exists rules_select on public.elimination_rules;
create policy rules_select on public.elimination_rules for select to authenticated using (true);
drop policy if exists rules_admin_write on public.elimination_rules;
create policy rules_admin_write on public.elimination_rules for all to authenticated using (public.pm_is_admin(auth.uid())) with check (public.pm_is_admin(auth.uid()));

-- predictions
drop policy if exists predictions_select on public.predictions;
create policy predictions_select on public.predictions for select to authenticated using (user_id = auth.uid() or public.pm_is_admin(auth.uid()));
drop policy if exists predictions_insert on public.predictions;
create policy predictions_insert on public.predictions for insert to authenticated
  with check (user_id = auth.uid() and public.pm_is_active_participant(auth.uid()) and public.pm_can_bet_on_match(match_id));
drop policy if exists predictions_update on public.predictions;
create policy predictions_update on public.predictions for update to authenticated
  using (user_id = auth.uid() and locked = false)
  with check (user_id = auth.uid() and public.pm_is_active_participant(auth.uid()) and public.pm_can_bet_on_match(match_id));
drop policy if exists predictions_admin_all on public.predictions;
create policy predictions_admin_all on public.predictions for all to authenticated using (public.pm_is_admin(auth.uid())) with check (public.pm_is_admin(auth.uid()));

-- =====================================================================
-- VISTA + GRANTS + REALTIME
-- =====================================================================
drop view if exists public.leaderboard;
create view public.leaderboard with (security_invoker = on) as
select user_id, full_name, status, total_points, matches_played, hits, misses,
       rank() over (order by total_points desc, hits desc) as position
from public.profiles where role = 'participant';
grant select on public.leaderboard to authenticated;

-- Revocar EXECUTE de funciones internas / endurecer
revoke execute on function public.pm_set_updated_at() from anon, authenticated;
revoke execute on function public.pm_set_bet_closes_at() from anon, authenticated;
revoke execute on function public.pm_set_match_winner() from anon, authenticated;
revoke execute on function public.pm_after_match_change() from anon, authenticated;
revoke execute on function public.pm_after_payment_change() from anon, authenticated;
revoke execute on function public.pm_protect_profile_fields() from anon, authenticated;
revoke execute on function public.pm_handle_new_user() from anon, authenticated;
revoke execute on function public.pm_recompute_match_predictions(uuid) from anon, authenticated;
revoke execute on function public.pm_propagate_bracket(uuid) from anon, authenticated;
revoke execute on function public.pm_is_admin(uuid) from anon;
revoke execute on function public.pm_is_active_participant(uuid) from anon;
revoke execute on function public.pm_can_bet_on_match(uuid) from anon;
revoke execute on function public.pm_recalculate_all() from anon;
revoke execute on function public.pm_apply_elimination(pm_match_stage) from anon;
grant execute on function public.pm_public_leaderboard() to anon, authenticated;

-- Conteo de participantes activos (para el premio en la landing anónima)
create or replace function public.pm_active_participant_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles where role = 'participant' and status = 'active';
$$;
revoke execute on function public.pm_active_participant_count() from public;
grant execute on function public.pm_active_participant_count() to anon, authenticated;

-- Transparencia: predicciones de todos, SOLO de partidos ya cerrados
create or replace function public.pm_transparency()
returns table(full_name text, user_id uuid, fifa_match_number int, stage pm_match_stage,
  group_letter text, home text, away text, match_datetime timestamptz, match_status pm_match_status,
  home_score int, away_score int, predicted_result pm_prediction_result, points_awarded int)
language sql stable security definer set search_path = public as $$
  select u.full_name, pr.user_id, m.fifa_match_number, m.stage, m.group_letter,
    coalesce(ht.name, m.home_placeholder), coalesce(at.name, m.away_placeholder),
    m.match_datetime, m.status, m.home_score, m.away_score, pr.predicted_result, pr.points_awarded
  from public.predictions pr
  join public.matches m on m.id = pr.match_id
  join public.profiles u on u.user_id = pr.user_id
  left join public.teams ht on ht.id = m.home_team_id
  left join public.teams at on at.id = m.away_team_id
  where now() >= m.bet_closes_at and u.role = 'participant'
  order by m.fifa_match_number, u.full_name;
$$;
revoke execute on function public.pm_transparency() from public, anon;
grant execute on function public.pm_transparency() to authenticated;

-- Ranking para usuarios autenticados (no expone PII; reemplaza el acceso directo a profiles)
create or replace function public.pm_leaderboard()
returns table(user_id uuid, full_name text, status pm_user_status,
  total_points int, matches_played int, hits int, misses int, "position" bigint)
language sql stable security definer set search_path = public as $$
  select user_id, full_name, status, total_points, matches_played, hits, misses,
         rank() over (order by total_points desc, hits desc) as position
  from public.profiles where role = 'participant' and status = 'active'
  order by position;
$$;
revoke execute on function public.pm_leaderboard() from public, anon;
grant execute on function public.pm_leaderboard() to authenticated;

-- Realtime
do $$
begin
  begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.matches; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.predictions; exception when duplicate_object then null; end;
end $$;
