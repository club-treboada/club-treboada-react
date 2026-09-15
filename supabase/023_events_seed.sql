-- =============================================================================
-- Club Treboada - Seed Open event rows from the current static data
-- =============================================================================
-- Run after 021_events.sql. `on conflict do nothing` so re-running this after
-- a coach has already edited a row never clobbers their changes.

insert into public.events (
  event_key, title, subtitle, event_date, description, poster_url,
  contact_email, contact_phone, contact_person, details_json
) values (
  'open-ritmica',
  'IV Torneo Open Treboada CidadeDoLerez',
  '¡Vuelve el Torneo Open Treboada Cidade do Lérez con su 4ª edición!',
  'Ximnasia Rítmica, 4 de Octubre, 2026',
  $$Tras varios años sin celebrarse, este 4 de octubre recuperamos con ilusión este formato: un torneo que reunirá a clubes de diferentes partes de España en una jornada de competición con fase clasificatoria y finales, tanto en modalidad individual como de conjuntos.

El evento se desarrollará en jornada de mañana y tarde en el Pabellón Municipal de los Deportes de Pontevedra, acogiendo a gimnastas de nivel base y absoluto.
¡Os esperamos!$$,
  '/images/open-rit/cartel.webp',
  'torneoclubtreboada@gmail.com',
  '613 99 07 13',
  'Laura',
  '[
    {"icon": "🏆", "text": "Modalidades: Individual y Conjuntos"},
    {"icon": "🎯", "text": "Niveles: Base y Absoluto"},
    {"icon": "📍", "text": "Pabellón Municipal dos Deportes de Pontevedra"},
    {"icon": "⏰", "text": "Jornada de mañana y tarde"}
  ]'::jsonb
)
on conflict (event_key) do nothing;

insert into public.events (
  event_key, title, subtitle, event_date, description, poster_url,
  contact_email, contact_phone, contact_person, details_json
) values (
  'open-acrobatica',
  'IV Open Treboada CidadeDoLerez',
  '✨ ¿Por qué participar en el OPEN TREBOADA?',
  'Ximnasia Acrobática, del 25 al 28 de Junio, 2026',
  $$🏅 Formato competición emocionante: parejas, tríos y cuartetos compiten codo con codo.
💶 Premio de 1.000 € para el equipo ganador y muchos premios más.
🌍 Ambiente internacional en el corazón de Galicia.
🏛️ Respaldo del Concello de Pontevedra, Diputación, Xunta de Galicia y la Federación Galega de Ximnasia.
🎟️ Organización cuidada, con acreditaciones, opciones de catering y espacios adaptados.

Más abajo podréis ver las bases del campeonato y el enlace para realizar la inscripción provisional, así como para apuntaros como voluntarios si queréis aportar vuestro granito de arena.

Será un honor contar con vosotrxs para vivir juntxs un fin de semana inolvidable de deporte, convivencia y pasión por la acrobática.

¡Os esperamos este verano en Pontevedra! 💚🌊

Un abrazo,
El equipo del Club Treboada$$,
  '/images/open-acro/cartel.webp',
  'opentreboada@gmail.com',
  null,
  null,
  '[]'::jsonb
)
on conflict (event_key) do nothing;
