-- =====================================================================
-- SEED INICIAL — Mundial 2026 (datos editables desde el panel admin)
-- Ejecutar DESPUÉS de schema.sql.
-- =====================================================================
do $$
declare
  v_groups text[] := array['A','B','C','D','E','F','G','H','I','J','K','L'];
  v_names  text[] := array[
    'México','Croacia','Ecuador','Noruega',
    'Canadá','Marruecos','Japón','Escocia',
    'Estados Unidos','Países Bajos','Australia','Paraguay',
    'Argentina','Senegal','Irán','Gales',
    'Francia','Suiza','Egipto','Nueva Zelanda',
    'Brasil','Uruguay','Corea del Sur','Túnez',
    'Inglaterra','Colombia','Arabia Saudita','Costa Rica',
    'Portugal','Dinamarca','Argelia','Panamá',
    'España','Serbia','Nigeria','Jordania',
    'Alemania','Polonia','Costa de Marfil','Honduras',
    'Bélgica','Perú','Ghana','Catar',
    'Italia','Suecia','Camerún','Uzbekistán'];
  v_codes text[] := array[
    'mx','hr','ec','no','ca','ma','jp','gb-sct','us','nl','au','py',
    'ar','sn','ir','gb-wls','fr','ch','eg','nz','br','uy','kr','tn',
    'gb-eng','co','sa','cr','pt','dk','dz','pa','es','rs','ng','jo',
    'de','pl','ci','hn','be','pe','gh','qa','it','se','cm','uz'];
  g text; ti int; gi int;
  pairs int[][] := array[[1,2],[3,4],[1,3],[2,4],[1,4],[2,3]];
  pi int; team_ids uuid[];
  base_group timestamptz := '2026-06-11 17:00:00+00';
  base_ko    timestamptz := '2026-07-04 17:00:00+00';
  mnum int := 1; k int;
begin
  foreach g in array v_groups loop
    insert into public.tournament_groups(letter,name) values (g,'Grupo '||g) on conflict (letter) do nothing;
  end loop;

  if (select count(*) from public.teams) = 0 then
    for ti in 1..48 loop
      gi := ((ti-1)/4);
      insert into public.teams(name,country_code,flag_url,group_letter)
      values (v_names[ti], v_codes[ti], 'https://flagcdn.com/'||v_codes[ti]||'.svg', v_groups[gi+1]);
    end loop;
  end if;

  if (select count(*) from public.matches) = 0 then
    foreach g in array v_groups loop
      select array_agg(id order by name) into team_ids from public.teams where group_letter = g;
      for pi in 1..6 loop
        insert into public.matches(fifa_match_number, stage, group_letter, home_team_id, away_team_id, match_datetime, status, stadium, city)
        values (mnum, 'groups', g, team_ids[pairs[pi][1]], team_ids[pairs[pi][2]],
                base_group + ((mnum-1) * interval '4 hours'), 'scheduled', 'Por definir', 'Por definir');
        mnum := mnum + 1;
      end loop;
    end loop;

    for k in 1..16 loop
      insert into public.matches(fifa_match_number, stage, home_placeholder, away_placeholder, match_datetime, status, stadium, city)
      values (72+k, 'round_32', 'Clasificado '||k||'A', 'Clasificado '||k||'B',
              base_ko + ((k-1) * interval '6 hours'), 'scheduled','Por definir','Por definir');
    end loop;
    for k in 1..8 loop
      insert into public.matches(fifa_match_number, stage, home_placeholder, away_placeholder, match_datetime, status, stadium, city)
      values (88+k, 'round_16', 'Ganador P'||(73+2*(k-1)), 'Ganador P'||(74+2*(k-1)),
              base_ko + interval '6 days' + ((k-1) * interval '6 hours'), 'scheduled','Por definir','Por definir');
    end loop;
    for k in 1..4 loop
      insert into public.matches(fifa_match_number, stage, home_placeholder, away_placeholder, match_datetime, status, stadium, city)
      values (96+k, 'quarter', 'Ganador P'||(89+2*(k-1)), 'Ganador P'||(90+2*(k-1)),
              base_ko + interval '11 days' + ((k-1) * interval '8 hours'), 'scheduled','Por definir','Por definir');
    end loop;
    for k in 1..2 loop
      insert into public.matches(fifa_match_number, stage, home_placeholder, away_placeholder, match_datetime, status, stadium, city)
      values (100+k, 'semi', 'Ganador P'||(97+2*(k-1)), 'Ganador P'||(98+2*(k-1)),
              base_ko + interval '15 days' + ((k-1) * interval '1 day'), 'scheduled','Por definir','Por definir');
    end loop;
    insert into public.matches(fifa_match_number, stage, home_placeholder, away_placeholder, match_datetime, status, stadium, city)
    values (103, 'third_place', 'Perdedor P101', 'Perdedor P102', base_ko + interval '18 days', 'scheduled','Por definir','Por definir');
    insert into public.matches(fifa_match_number, stage, home_placeholder, away_placeholder, match_datetime, status, stadium, city)
    values (104, 'final', 'Ganador P101', 'Ganador P102', base_ko + interval '19 days', 'scheduled','Por definir','Por definir');
  end if;
end $$;

insert into public.tournament_settings(key, value) values
  ('tournament_name',   'Polla Mundialista FIFA 2026'),
  ('entry_fee',         '50000'),
  ('currency',          'COP'),
  ('points_per_correct','1'),
  ('registration_open', 'true'),
  ('public_leaderboard','true'),
  ('payment_instructions','Realiza la transferencia a la cuenta del organizador y registra la referencia. El administrador aprobará tu cupo manualmente.')
on conflict (key) do nothing;

insert into public.elimination_rules(stage, minimum_points, active) values
  ('groups',   20, true),
  ('round_32', 26, true),
  ('round_16', 30, true),
  ('quarter',   0, false),
  ('semi',      0, false)
on conflict (stage) do nothing;
