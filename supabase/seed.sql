-- =====================================================================
-- SEED OFICIAL — Calendario FIFA World Cup 2026 (fuente: FIFA.com)
-- Horas almacenadas en UTC a partir de la hora del Este de EE. UU. (EDT, -04).
-- La app las muestra en hora de Colombia (America/Bogota), formato 12h.
-- Ejecutar DESPUÉS de schema.sql.
-- =====================================================================

-- ---- GRUPOS A-L ----
insert into public.tournament_groups(letter, name)
select g, 'Grupo '||g from unnest(array['A','B','C','D','E','F','G','H','I','J','K','L']) as g
on conflict (letter) do nothing;

-- ---- 48 SELECCIONES ----
insert into public.teams(name, country_code, flag_url, group_letter)
select v.name, v.code, 'https://flagcdn.com/'||v.code||'.svg', v.grp
from (values
  ('México','mx','A'),('Sudáfrica','za','A'),('República de Corea','kr','A'),('República Checa','cz','A'),
  ('Canadá','ca','B'),('Bosnia y Herzegovina','ba','B'),('Catar','qa','B'),('Suiza','ch','B'),
  ('Brasil','br','C'),('Marruecos','ma','C'),('Haití','ht','C'),('Escocia','gb-sct','C'),
  ('Estados Unidos','us','D'),('Paraguay','py','D'),('Australia','au','D'),('Turquía','tr','D'),
  ('Alemania','de','E'),('Curazao','cw','E'),('Costa de Marfil','ci','E'),('Ecuador','ec','E'),
  ('Países Bajos','nl','F'),('Japón','jp','F'),('Suecia','se','F'),('Túnez','tn','F'),
  ('Bélgica','be','G'),('Egipto','eg','G'),('Irán','ir','G'),('Nueva Zelanda','nz','G'),
  ('España','es','H'),('Cabo Verde','cv','H'),('Arabia Saudí','sa','H'),('Uruguay','uy','H'),
  ('Francia','fr','I'),('Senegal','sn','I'),('Irak','iq','I'),('Noruega','no','I'),
  ('Argentina','ar','J'),('Argelia','dz','J'),('Austria','at','J'),('Jordania','jo','J'),
  ('Portugal','pt','K'),('RD Congo','cd','K'),('Uzbekistán','uz','K'),('Colombia','co','K'),
  ('Inglaterra','gb-eng','L'),('Croacia','hr','L'),('Ghana','gh','L'),('Panamá','pa','L')
) as v(name, code, grp)
where not exists (select 1 from public.teams);

-- ---- 72 PARTIDOS FASE DE GRUPOS ----
insert into public.matches(fifa_match_number, stage, group_letter, home_team_id, away_team_id, match_datetime, stadium, city, status)
select v.num, 'groups', v.grp, ht.id, at.id, v.dt::timestamptz, v.stadium, v.city, 'scheduled'
from (values
  (1,'A','México','Sudáfrica','2026-06-11 15:00-04','Estadio Ciudad de México','Ciudad de México'),
  (2,'A','República de Corea','República Checa','2026-06-11 22:00-04','Estadio Guadalajara','Guadalajara'),
  (3,'B','Canadá','Bosnia y Herzegovina','2026-06-12 15:00-04','Estadio Toronto','Toronto'),
  (4,'D','Estados Unidos','Paraguay','2026-06-12 21:00-04','Estadio Los Ángeles','Los Ángeles'),
  (5,'B','Catar','Suiza','2026-06-13 15:00-04','Estadio Bahía de San Francisco','San Francisco'),
  (6,'C','Brasil','Marruecos','2026-06-13 18:00-04','Estadio Nueva York Nueva Jersey','Nueva York/Nueva Jersey'),
  (7,'C','Haití','Escocia','2026-06-13 21:00-04','Estadio Boston','Boston'),
  (8,'D','Australia','Turquía','2026-06-14 00:00-04','Estadio BC Place Vancouver','Vancouver'),
  (9,'E','Alemania','Curazao','2026-06-14 13:00-04','Estadio Houston','Houston'),
  (10,'F','Países Bajos','Japón','2026-06-14 16:00-04','Estadio Dallas','Dallas'),
  (11,'E','Costa de Marfil','Ecuador','2026-06-14 19:00-04','Estadio Filadelfia','Filadelfia'),
  (12,'F','Suecia','Túnez','2026-06-14 22:00-04','Estadio Monterrey','Monterrey'),
  (13,'H','España','Cabo Verde','2026-06-15 12:00-04','Estadio Atlanta','Atlanta'),
  (14,'G','Bélgica','Egipto','2026-06-15 15:00-04','Estadio Seattle','Seattle'),
  (15,'H','Arabia Saudí','Uruguay','2026-06-15 18:00-04','Estadio Miami','Miami'),
  (16,'G','Irán','Nueva Zelanda','2026-06-15 21:00-04','Estadio Los Ángeles','Los Ángeles'),
  (17,'I','Francia','Senegal','2026-06-16 15:00-04','Estadio Nueva York Nueva Jersey','Nueva York/Nueva Jersey'),
  (18,'I','Irak','Noruega','2026-06-16 18:00-04','Estadio Boston','Boston'),
  (19,'J','Argentina','Argelia','2026-06-16 21:00-04','Estadio Kansas City','Kansas City'),
  (20,'J','Austria','Jordania','2026-06-17 00:00-04','Estadio Bahía de San Francisco','San Francisco'),
  (21,'K','Portugal','RD Congo','2026-06-17 13:00-04','Estadio Houston','Houston'),
  (22,'L','Inglaterra','Croacia','2026-06-17 16:00-04','Estadio Dallas','Dallas'),
  (23,'L','Ghana','Panamá','2026-06-17 19:00-04','Estadio Toronto','Toronto'),
  (24,'K','Uzbekistán','Colombia','2026-06-17 22:00-04','Estadio Ciudad de México','Ciudad de México'),
  (25,'A','República Checa','Sudáfrica','2026-06-18 12:00-04','Estadio Atlanta','Atlanta'),
  (26,'B','Suiza','Bosnia y Herzegovina','2026-06-18 15:00-04','Estadio Los Ángeles','Los Ángeles'),
  (27,'B','Canadá','Catar','2026-06-18 18:00-04','Estadio BC Place Vancouver','Vancouver'),
  (28,'A','México','República de Corea','2026-06-18 21:00-04','Estadio Guadalajara','Guadalajara'),
  (29,'D','Estados Unidos','Australia','2026-06-19 15:00-04','Estadio Seattle','Seattle'),
  (30,'C','Escocia','Marruecos','2026-06-19 18:00-04','Estadio Boston','Boston'),
  (31,'C','Brasil','Haití','2026-06-19 21:00-04','Estadio Filadelfia','Filadelfia'),
  (32,'D','Turquía','Paraguay','2026-06-20 00:00-04','Estadio Bahía de San Francisco','San Francisco'),
  (33,'F','Países Bajos','Suecia','2026-06-20 13:00-04','Estadio Houston','Houston'),
  (34,'E','Alemania','Costa de Marfil','2026-06-20 16:00-04','Estadio Toronto','Toronto'),
  (35,'E','Ecuador','Curazao','2026-06-20 22:00-04','Estadio Kansas City','Kansas City'),
  (36,'F','Túnez','Japón','2026-06-21 00:00-04','Estadio Monterrey','Monterrey'),
  (37,'H','España','Arabia Saudí','2026-06-21 12:00-04','Estadio Atlanta','Atlanta'),
  (38,'G','Bélgica','Irán','2026-06-21 15:00-04','Estadio Los Ángeles','Los Ángeles'),
  (39,'H','Uruguay','Cabo Verde','2026-06-21 18:00-04','Estadio Miami','Miami'),
  (40,'G','Nueva Zelanda','Egipto','2026-06-21 21:00-04','Estadio BC Place Vancouver','Vancouver'),
  (41,'J','Argentina','Austria','2026-06-22 13:00-04','Estadio Dallas','Dallas'),
  (42,'I','Francia','Irak','2026-06-22 17:00-04','Estadio Filadelfia','Filadelfia'),
  (43,'I','Noruega','Senegal','2026-06-22 20:00-04','Estadio Nueva York Nueva Jersey','Nueva York/Nueva Jersey'),
  (44,'J','Jordania','Argelia','2026-06-22 23:00-04','Estadio Bahía de San Francisco','San Francisco'),
  (45,'K','Portugal','Uzbekistán','2026-06-23 13:00-04','Estadio Houston','Houston'),
  (46,'L','Inglaterra','Ghana','2026-06-23 16:00-04','Estadio Boston','Boston'),
  (47,'L','Panamá','Croacia','2026-06-23 19:00-04','Estadio Toronto','Toronto'),
  (48,'K','Colombia','RD Congo','2026-06-23 22:00-04','Estadio Guadalajara','Guadalajara'),
  (49,'B','Suiza','Canadá','2026-06-24 15:00-04','Estadio BC Place Vancouver','Vancouver'),
  (50,'B','Bosnia y Herzegovina','Catar','2026-06-24 15:00-04','Estadio Seattle','Seattle'),
  (51,'C','Escocia','Brasil','2026-06-24 18:00-04','Estadio Miami','Miami'),
  (52,'C','Marruecos','Haití','2026-06-24 18:00-04','Estadio Atlanta','Atlanta'),
  (53,'A','República Checa','México','2026-06-24 21:00-04','Estadio Ciudad de México','Ciudad de México'),
  (54,'A','Sudáfrica','República de Corea','2026-06-24 21:00-04','Estadio Monterrey','Monterrey'),
  (55,'E','Curazao','Costa de Marfil','2026-06-25 16:00-04','Estadio Filadelfia','Filadelfia'),
  (56,'E','Ecuador','Alemania','2026-06-25 16:00-04','Estadio Nueva York Nueva Jersey','Nueva York/Nueva Jersey'),
  (57,'F','Japón','Suecia','2026-06-25 19:00-04','Estadio Dallas','Dallas'),
  (58,'F','Túnez','Países Bajos','2026-06-25 19:00-04','Estadio Kansas City','Kansas City'),
  (59,'D','Turquía','Estados Unidos','2026-06-25 22:00-04','Estadio Los Ángeles','Los Ángeles'),
  (60,'D','Paraguay','Australia','2026-06-25 22:00-04','Estadio Bahía de San Francisco','San Francisco'),
  (61,'I','Noruega','Francia','2026-06-26 15:00-04','Estadio Boston','Boston'),
  (62,'I','Senegal','Irak','2026-06-26 15:00-04','Estadio Toronto','Toronto'),
  (63,'H','Cabo Verde','Arabia Saudí','2026-06-26 20:00-04','Estadio Houston','Houston'),
  (64,'H','Uruguay','España','2026-06-26 20:00-04','Estadio Guadalajara','Guadalajara'),
  (65,'G','Egipto','Irán','2026-06-26 23:00-04','Estadio Seattle','Seattle'),
  (66,'G','Nueva Zelanda','Bélgica','2026-06-26 23:00-04','Estadio BC Place Vancouver','Vancouver'),
  (67,'L','Panamá','Inglaterra','2026-06-27 17:00-04','Estadio Nueva York Nueva Jersey','Nueva York/Nueva Jersey'),
  (68,'L','Croacia','Ghana','2026-06-27 17:00-04','Estadio Filadelfia','Filadelfia'),
  (69,'K','Colombia','Portugal','2026-06-27 19:30-04','Estadio Miami','Miami'),
  (70,'K','RD Congo','Uzbekistán','2026-06-27 19:30-04','Estadio Atlanta','Atlanta'),
  (71,'J','Argelia','Austria','2026-06-27 22:00-04','Estadio Kansas City','Kansas City'),
  (72,'J','Jordania','Argentina','2026-06-27 22:00-04','Estadio Dallas','Dallas')
) as v(num, grp, home, away, dt, stadium, city)
join public.teams ht on ht.name = v.home
join public.teams at on at.name = v.away
where not exists (select 1 from public.matches);

-- ---- 32 PARTIDOS DE ELIMINATORIAS (horas por confirmar; default 16:00 ET) ----
insert into public.matches(fifa_match_number, stage, home_placeholder, away_placeholder, match_datetime, stadium, city, status)
select v.num, v.stage::pm_match_stage, v.home, v.away, v.dt::timestamptz, v.stadium, v.city, 'scheduled'
from (values
  (73,'round_32','2º Grupo A','2º Grupo B','2026-06-28 16:00-04','Estadio Los Ángeles','Los Ángeles'),
  (74,'round_32','1º Grupo E','3º Grupo A/B/C/D/F','2026-06-29 16:00-04','Estadio Boston','Boston'),
  (75,'round_32','1º Grupo F','2º Grupo C','2026-06-29 16:00-04','Estadio Monterrey','Monterrey'),
  (76,'round_32','1º Grupo C','2º Grupo F','2026-06-29 16:00-04','Estadio Houston','Houston'),
  (77,'round_32','1º Grupo I','3º Grupo C/D/F/G/H','2026-06-30 16:00-04','Estadio Nueva York Nueva Jersey','Nueva York/Nueva Jersey'),
  (78,'round_32','2º Grupo E','2º Grupo I','2026-06-30 16:00-04','Estadio Dallas','Dallas'),
  (79,'round_32','1º Grupo A','3º Grupo C/E/F/H/I','2026-06-30 16:00-04','Estadio Ciudad de México','Ciudad de México'),
  (80,'round_32','1º Grupo L','3º Grupo E/H/I/J/K','2026-07-01 16:00-04','Estadio Atlanta','Atlanta'),
  (81,'round_32','1º Grupo D','3º Grupo B/E/F/I/J','2026-07-01 16:00-04','Estadio Bahía de San Francisco','San Francisco'),
  (82,'round_32','1º Grupo G','3º Grupo A/E/H/I/J','2026-07-01 16:00-04','Estadio Seattle','Seattle'),
  (83,'round_32','2º Grupo K','2º Grupo L','2026-07-02 16:00-04','Estadio Toronto','Toronto'),
  (84,'round_32','1º Grupo H','2º Grupo J','2026-07-02 16:00-04','Estadio Los Ángeles','Los Ángeles'),
  (85,'round_32','1º Grupo B','3º Grupo E/F/G/I/J','2026-07-02 16:00-04','Estadio BC Place Vancouver','Vancouver'),
  (86,'round_32','1º Grupo J','2º Grupo H','2026-07-03 16:00-04','Estadio Miami','Miami'),
  (87,'round_32','1º Grupo K','3º Grupo D/E/I/J/L','2026-07-03 16:00-04','Estadio Kansas City','Kansas City'),
  (88,'round_32','2º Grupo D','2º Grupo G','2026-07-03 16:00-04','Estadio Dallas','Dallas'),
  (89,'round_16','Ganador Partido 74','Ganador Partido 77','2026-07-04 16:00-04','Estadio Filadelfia','Filadelfia'),
  (90,'round_16','Ganador Partido 73','Ganador Partido 75','2026-07-04 16:00-04','Estadio Houston','Houston'),
  (91,'round_16','Ganador Partido 76','Ganador Partido 78','2026-07-05 16:00-04','Estadio Nueva York Nueva Jersey','Nueva York/Nueva Jersey'),
  (92,'round_16','Ganador Partido 79','Ganador Partido 80','2026-07-05 16:00-04','Estadio Ciudad de México','Ciudad de México'),
  (93,'round_16','Ganador Partido 83','Ganador Partido 84','2026-07-06 16:00-04','Estadio Dallas','Dallas'),
  (94,'round_16','Ganador Partido 81','Ganador Partido 82','2026-07-06 16:00-04','Estadio Seattle','Seattle'),
  (95,'round_16','Ganador Partido 86','Ganador Partido 88','2026-07-07 16:00-04','Estadio Atlanta','Atlanta'),
  (96,'round_16','Ganador Partido 85','Ganador Partido 87','2026-07-07 16:00-04','Estadio BC Place Vancouver','Vancouver'),
  (97,'quarter','Ganador Partido 89','Ganador Partido 90','2026-07-09 16:00-04','Estadio Boston','Boston'),
  (98,'quarter','Ganador Partido 93','Ganador Partido 94','2026-07-10 16:00-04','Estadio Los Ángeles','Los Ángeles'),
  (99,'quarter','Ganador Partido 91','Ganador Partido 92','2026-07-11 16:00-04','Estadio Miami','Miami'),
  (100,'quarter','Ganador Partido 95','Ganador Partido 96','2026-07-11 16:00-04','Estadio Kansas City','Kansas City'),
  (101,'semi','Ganador Partido 97','Ganador Partido 98','2026-07-14 16:00-04','Estadio Dallas','Dallas'),
  (102,'semi','Ganador Partido 99','Ganador Partido 100','2026-07-15 16:00-04','Estadio Atlanta','Atlanta'),
  (103,'third_place','Perdedor Partido 101','Perdedor Partido 102','2026-07-18 16:00-04','Estadio Miami','Miami'),
  (104,'final','Ganador Partido 101','Ganador Partido 102','2026-07-19 16:00-04','Estadio Nueva York Nueva Jersey','Nueva York/Nueva Jersey')
) as v(num, stage, home, away, dt, stadium, city)
where not exists (select 1 from public.matches where stage <> 'groups');

-- ---- CONFIGURACIÓN GLOBAL ----
insert into public.tournament_settings(key, value) values
  ('tournament_name',   'Polla Mundialista FIFA 2026'),
  ('entry_fee',         '100000'),
  ('currency',          'COP'),
  ('points_per_correct','1'),
  ('registration_open', 'true'),
  ('public_leaderboard','true'),
  ('payment_instructions','Realiza la transferencia a la cuenta del organizador y registra la referencia. El administrador aprobará tu cupo manualmente.')
on conflict (key) do nothing;

-- ---- REGLAS DE ELIMINACIÓN POR FASE ----
insert into public.elimination_rules(stage, minimum_points, active) values
  ('groups',   20, true),
  ('round_32', 26, true),
  ('round_16', 30, true),
  ('quarter',   0, false),
  ('semi',      0, false)
on conflict (stage) do nothing;
