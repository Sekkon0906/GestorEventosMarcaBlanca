/* GESTEK Event OS — Schema inicial
   Aplicar en Supabase SQL Editor del proyecto destino.
   Idempotente con IF NOT EXISTS donde aplica.

   Convenciones:
   - PK   : uuid generado por gen_random_uuid()
   - FK   : on delete cascade donde tiene sentido lógico
   - RLS  : activado en todas las tablas; políticas se definen al final
   - time : timestamptz, default now()
*/

create extension if not exists "pgcrypto";

/* ──────────────────────────────────────────────────────────────
   1. PROFILES (extiende auth.users)
   ────────────────────────────────────────────────────────────── */
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  nombre      text not null,
  handle      text unique,                         -- ej: "juan.medina" — para URLs públicas
  avatar_url  text,
  telefono    text,
  ciudad      text,
  empresa     text,
  ocupacion   text,
  rol         text not null default 'organizador', -- organizador | asistente | admin_global
  puntos      integer not null default 0,
  nivel       text not null default 'bronze',      -- bronze | silver | gold | platinum
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_handle_idx on public.profiles (handle);

/* Trigger: cuando se crea un auth.users, insertar profile con metadata */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre, rol, telefono, ciudad, empresa, ocupacion, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', new.email),
    coalesce(new.raw_user_meta_data->>'rol', 'organizador'),
    new.raw_user_meta_data->>'telefono',
    new.raw_user_meta_data->>'ciudad',
    new.raw_user_meta_data->>'empresa',
    new.raw_user_meta_data->>'ocupacion',
    new.raw_user_meta_data->>'foto'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/* ──────────────────────────────────────────────────────────────
   2. CATEGORIAS (catálogo simple)
   ────────────────────────────────────────────────────────────── */
create table if not exists public.categorias (
  id    uuid primary key default gen_random_uuid(),
  slug  text unique not null,
  nombre text not null
);

insert into public.categorias (slug, nombre) values
  ('tecnologia',  'Tecnología'),
  ('negocios',    'Negocios'),
  ('marketing',   'Marketing'),
  ('diseno',      'Diseño'),
  ('educacion',   'Educación'),
  ('musica',      'Música'),
  ('deportes',    'Deportes'),
  ('cultura',     'Cultura'),
  ('otros',       'Otros')
on conflict (slug) do nothing;

/* ──────────────────────────────────────────────────────────────
   3. EVENTOS
   slug es único globalmente porque la ruta es /explorar/[slug].
   ────────────────────────────────────────────────────────────── */
create table if not exists public.eventos (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  categoria_id  uuid references public.categorias(id),

  titulo        text not null,
  slug          text unique not null,
  descripcion   text,
  cover_url     text,

  estado        text not null default 'borrador',   -- borrador | publicado | cancelado | finalizado
  modalidad     text not null default 'fisico',     -- fisico | virtual | hibrido

  fecha_inicio  timestamptz not null,
  fecha_fin     timestamptz,
  timezone      text default 'America/Bogota',

  /* Ubicación física */
  location_nombre text,
  location_direccion text,
  lat            double precision,
  lng            double precision,
  /* Virtual */
  url_virtual    text,

  /* Editor visual drag&drop (Fase B) */
  page_json      jsonb not null default '{"blocks":[]}'::jsonb,

  /* Negocio */
  currency       text not null default 'COP',
  edad_minima    integer,
  aforo_total    integer,
  aforo_vendido  integer not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz,
  deleted_at    timestamptz
);

create index if not exists eventos_owner_idx     on public.eventos (owner_id);
create index if not exists eventos_estado_idx    on public.eventos (estado) where deleted_at is null;
create index if not exists eventos_fecha_idx     on public.eventos (fecha_inicio);
create index if not exists eventos_categoria_idx on public.eventos (categoria_id);

/* ──────────────────────────────────────────────────────────────
   4. TIPOS DE TICKET
   ────────────────────────────────────────────────────────────── */
create table if not exists public.ticket_types (
  id              uuid primary key default gen_random_uuid(),
  evento_id       uuid not null references public.eventos(id) on delete cascade,
  nombre          text not null,                          -- "General", "VIP", "Early Bird"
  descripcion     text,
  precio          numeric(12,2) not null default 0,
  currency        text not null default 'COP',
  cupo            integer,                                -- null = ilimitado
  vendidos        integer not null default 0,

  early_bird_precio numeric(12,2),
  early_bird_hasta  timestamptz,
  venta_hasta       timestamptz,

  zonas_acceso     text[] default '{}',                   -- ["general","vip","backstage"]
  orden            integer not null default 0,
  activo           boolean not null default true,

  created_at      timestamptz not null default now()
);

create index if not exists ticket_types_evento_idx on public.ticket_types (evento_id);

/* ──────────────────────────────────────────────────────────────
   5. TICKETS (boletas individuales emitidas)
   ────────────────────────────────────────────────────────────── */
create table if not exists public.tickets (
  id             uuid primary key default gen_random_uuid(),
  ticket_type_id uuid not null references public.ticket_types(id),
  evento_id      uuid not null references public.eventos(id) on delete cascade,
  user_id        uuid references public.profiles(id),       -- null = invitado sin cuenta

  /* Datos del comprador si no tiene cuenta */
  guest_email    text,
  guest_nombre   text,

  qr_token       text unique,                               -- JWT firmado (se genera al emitir)
  codigo         text unique,                               -- código alfanumérico corto fallback

  estado         text not null default 'emitido',           -- emitido | pagado | usado | reembolsado | invalido
  pagado_at      timestamptz,
  checked_in_at  timestamptz,
  zona_usada     text,

  discount_code_id uuid,
  precio_pagado    numeric(12,2),

  created_at     timestamptz not null default now()
);

create index if not exists tickets_evento_idx  on public.tickets (evento_id);
create index if not exists tickets_user_idx    on public.tickets (user_id);
create index if not exists tickets_estado_idx  on public.tickets (estado);

/* ──────────────────────────────────────────────────────────────
   6. CÓDIGOS DE DESCUENTO
   ────────────────────────────────────────────────────────────── */
create table if not exists public.discount_codes (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references public.eventos(id) on delete cascade,
  codigo        text not null,
  tipo          text not null,                  -- percent | fixed
  valor         numeric(12,2) not null,
  max_usos      integer,
  usos          integer not null default 0,
  expira_at     timestamptz,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (evento_id, codigo)
);

alter table public.tickets
  add constraint tickets_discount_fk
  foreign key (discount_code_id) references public.discount_codes(id) on delete set null
  not valid;

/* ──────────────────────────────────────────────────────────────
   7. AGENDA / SPEAKERS / SPONSORS
   ────────────────────────────────────────────────────────────── */
create table if not exists public.speakers (
  id           uuid primary key default gen_random_uuid(),
  evento_id    uuid not null references public.eventos(id) on delete cascade,
  nombre       text not null,
  bio          text,
  foto_url     text,
  empresa      text,
  social_links jsonb default '{}'::jsonb,
  orden        integer not null default 0
);

create table if not exists public.agenda_sessions (
  id           uuid primary key default gen_random_uuid(),
  evento_id    uuid not null references public.eventos(id) on delete cascade,
  track        text default 'principal',
  titulo       text not null,
  descripcion  text,
  inicio       timestamptz not null,
  fin          timestamptz,
  ubicacion    text,
  speaker_id   uuid references public.speakers(id) on delete set null,
  orden        integer not null default 0
);

create index if not exists speakers_evento_idx on public.speakers (evento_id);
create index if not exists agenda_evento_idx   on public.agenda_sessions (evento_id);

create table if not exists public.sponsors (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references public.eventos(id) on delete cascade,
  nombre     text not null,
  logo_url   text,
  tier       text default 'silver',         -- gold | silver | bronze
  url        text,
  orden      integer not null default 0
);

/* ──────────────────────────────────────────────────────────────
   8. CHAT (Fase E)
   ────────────────────────────────────────────────────────────── */
create table if not exists public.chat_channels (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references public.eventos(id) on delete cascade,
  nombre      text not null,
  tipo        text not null default 'general',  -- general | staff | vip | org
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  channel_id   uuid not null references public.chat_channels(id) on delete cascade,
  user_id      uuid not null references public.profiles(id),
  contenido    text not null,
  file_url     text,
  created_at   timestamptz not null default now()
);

create index if not exists chat_messages_channel_idx on public.chat_messages (channel_id, created_at);

/* ──────────────────────────────────────────────────────────────
   9. GAMIFICACIÓN (Fase F)
   ────────────────────────────────────────────────────────────── */
create table if not exists public.points_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  evento_id   uuid references public.eventos(id) on delete set null,
  accion      text not null,                  -- checkin | early_bird | referral | survey | mission
  puntos      integer not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.user_badges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  badge_slug  text not null,
  evento_id   uuid references public.eventos(id) on delete set null,
  earned_at   timestamptz not null default now(),
  unique (user_id, badge_slug, evento_id)
);

create table if not exists public.missions (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  titulo          text not null,
  descripcion     text,
  condition_type  text not null,         -- attend_n | invite_n | survey_n
  condition_value integer not null,
  reward_puntos   integer not null default 0,
  badge_slug      text,
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.referral_codes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  evento_id       uuid references public.eventos(id) on delete cascade,
  codigo          text unique not null,
  usos            integer not null default 0,
  puntos_por_uso  integer not null default 0,
  created_at      timestamptz not null default now()
);

/* ──────────────────────────────────────────────────────────────
   10. NOTIFICACIONES (in-app)
   ────────────────────────────────────────────────────────────── */
create table if not exists public.notificaciones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  evento_id   uuid references public.eventos(id) on delete cascade,
  tipo        text not null,            -- info | success | warning | reminder
  titulo      text not null,
  cuerpo      text,
  leida       boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notif_user_idx on public.notificaciones (user_id, leida, created_at desc);

/* ──────────────────────────────────────────────────────────────
   11. updated_at automático
   ────────────────────────────────────────────────────────────── */
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_profiles_updated  on public.profiles;
create trigger trg_profiles_updated  before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists trg_eventos_updated   on public.eventos;
create trigger trg_eventos_updated   before update on public.eventos  for each row execute function public.set_updated_at();

/* ──────────────────────────────────────────────────────────────
   12. RLS — Row Level Security
   Política base: el dueño del evento gestiona todo lo suyo.
   El público lee solo eventos publicados (estado='publicado', deleted_at is null).
   El backend con service_role pasa por encima de RLS.
   ────────────────────────────────────────────────────────────── */
alter table public.profiles        enable row level security;
alter table public.eventos         enable row level security;
alter table public.ticket_types    enable row level security;
alter table public.tickets         enable row level security;
alter table public.discount_codes  enable row level security;
alter table public.speakers        enable row level security;
alter table public.agenda_sessions enable row level security;
alter table public.sponsors        enable row level security;
alter table public.chat_channels   enable row level security;
alter table public.chat_messages   enable row level security;
alter table public.points_log      enable row level security;
alter table public.user_badges     enable row level security;
alter table public.missions        enable row level security;
alter table public.referral_codes  enable row level security;
alter table public.notificaciones  enable row level security;
alter table public.categorias      enable row level security;

/* Categorías: lectura pública */
drop policy if exists categorias_select on public.categorias;
create policy categorias_select on public.categorias for select using (true);

/* Profiles: cada uno lee y actualiza el suyo; lectura pública del handle/avatar */
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select using (auth.uid() = id or true);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (auth.uid() = id);

/* Eventos:
   - SELECT público: solo publicados y no borrados
   - SELECT dueño: todos los suyos
   - INSERT/UPDATE/DELETE: solo dueño */
drop policy if exists eventos_select_publico on public.eventos;
create policy eventos_select_publico on public.eventos
  for select using (estado = 'publicado' and deleted_at is null);
drop policy if exists eventos_select_owner on public.eventos;
create policy eventos_select_owner on public.eventos
  for select using (auth.uid() = owner_id);
drop policy if exists eventos_insert_owner on public.eventos;
create policy eventos_insert_owner on public.eventos
  for insert with check (auth.uid() = owner_id);
drop policy if exists eventos_update_owner on public.eventos;
create policy eventos_update_owner on public.eventos
  for update using (auth.uid() = owner_id);
drop policy if exists eventos_delete_owner on public.eventos;
create policy eventos_delete_owner on public.eventos
  for delete using (auth.uid() = owner_id);

/* Tickets: el dueño del evento ve todos; el usuario ve los suyos */
drop policy if exists tickets_select_own on public.tickets;
create policy tickets_select_own on public.tickets
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.eventos e where e.id = tickets.evento_id and e.owner_id = auth.uid())
  );

/* Tipos de ticket: lectura pública si el evento está publicado, mutación solo dueño */
drop policy if exists ticket_types_select on public.ticket_types;
create policy ticket_types_select on public.ticket_types
  for select using (
    exists (
      select 1 from public.eventos e
      where e.id = ticket_types.evento_id
        and ((e.estado = 'publicado' and e.deleted_at is null) or e.owner_id = auth.uid())
    )
  );
drop policy if exists ticket_types_write_owner on public.ticket_types;
create policy ticket_types_write_owner on public.ticket_types
  for all using (
    exists (select 1 from public.eventos e where e.id = ticket_types.evento_id and e.owner_id = auth.uid())
  );

/* Speakers / Agenda / Sponsors: lectura pública si publicado, write solo dueño */
do $$
declare t text;
begin
  for t in select unnest(array['speakers','agenda_sessions','sponsors','discount_codes']) loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format($p$
      create policy %1$s_select on public.%1$s
      for select using (
        exists (
          select 1 from public.eventos e
          where e.id = %1$s.evento_id
            and ((e.estado = 'publicado' and e.deleted_at is null) or e.owner_id = auth.uid())
        )
      )
    $p$, t);
    execute format('drop policy if exists %1$s_write_owner on public.%1$s', t);
    execute format($p$
      create policy %1$s_write_owner on public.%1$s
      for all using (
        exists (select 1 from public.eventos e where e.id = %1$s.evento_id and e.owner_id = auth.uid())
      )
    $p$, t);
  end loop;
end$$;

/* Chat: solo participantes con ticket válido o el dueño del evento */
drop policy if exists chat_channels_select on public.chat_channels;
create policy chat_channels_select on public.chat_channels
  for select using (
    exists (select 1 from public.eventos e where e.id = chat_channels.evento_id and e.owner_id = auth.uid())
    or exists (select 1 from public.tickets t where t.evento_id = chat_channels.evento_id and t.user_id = auth.uid() and t.estado in ('pagado','usado'))
  );

drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_channels c
      join public.eventos e on e.id = c.evento_id
      where c.id = chat_messages.channel_id
        and (e.owner_id = auth.uid()
             or exists (select 1 from public.tickets t where t.evento_id = e.id and t.user_id = auth.uid() and t.estado in ('pagado','usado')))
    )
  );
drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert on public.chat_messages
  for insert with check (auth.uid() = user_id);

/* Notificaciones: solo el dueño */
drop policy if exists notif_select_self on public.notificaciones;
create policy notif_select_self on public.notificaciones for select using (auth.uid() = user_id);
drop policy if exists notif_update_self on public.notificaciones;
create policy notif_update_self on public.notificaciones for update using (auth.uid() = user_id);

/* Gamificación: lectura propia */
drop policy if exists points_log_self on public.points_log;
create policy points_log_self on public.points_log for select using (auth.uid() = user_id);
drop policy if exists user_badges_self on public.user_badges;
create policy user_badges_self on public.user_badges for select using (auth.uid() = user_id);
drop policy if exists referral_codes_self on public.referral_codes;
create policy referral_codes_self on public.referral_codes for all using (auth.uid() = user_id);
drop policy if exists missions_owner on public.missions;
create policy missions_owner on public.missions for all using (auth.uid() = owner_id);

/* ──────────────────────────────────────────────────────────────
   FIN.
   ────────────────────────────────────────────────────────────── */
/* GESTEK — Agregar columna `links` a eventos.
   Guarda links de streaming + redes sociales como arreglo dinámico de
   { tipo, url, label? } definidos por el organizador.

   Ejemplo:
     [
       { "tipo": "youtube",   "url": "https://youtube.com/live/..." },
       { "tipo": "zoom",      "url": "https://zoom.us/j/..." },
       { "tipo": "instagram", "url": "https://instagram.com/evento" },
       { "tipo": "custom",    "url": "https://...", "label": "Web del evento" }
     ]
*/

alter table public.eventos
  add column if not exists links jsonb not null default '[]'::jsonb;

/* url_virtual queda como compatibilidad — los eventos viejos se migran al
   array en el primer save desde la UI.  No se borra para no romper datos. */
/* GESTEK — Soporte completo para signup con Google.

   Problemas que arregla:
   1. El trigger handle_new_user solo leía 'nombre' y 'foto' del metadata,
      pero Google envía 'full_name', 'name', 'picture', 'avatar_url'.
   2. Los usuarios ya creados con Google tienen profile.nombre = email
      porque el trigger no encontró 'nombre' en su metadata.

   Esta migration:
   - Reescribe el trigger para leer también los campos de Google.
   - Hace un sync retroactivo de los profiles existentes.
*/

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (
    id, email, nombre, rol,
    telefono, ciudad, empresa, ocupacion, avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(
      meta->>'nombre',
      meta->>'full_name',
      meta->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(meta->>'rol', 'organizador'),
    meta->>'telefono',
    meta->>'ciudad',
    meta->>'empresa',
    meta->>'ocupacion',
    coalesce(
      meta->>'foto',
      meta->>'avatar_url',
      meta->>'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

/* Sync retroactivo: si profile.nombre == email (signal de que el trigger
   viejo no encontró nombre) o avatar_url es null, intenta rellenar desde
   el metadata. */
update public.profiles p
set
  nombre = coalesce(
    nullif(p.nombre, p.email),
    u.raw_user_meta_data->>'nombre',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(p.email, '@', 1),
    p.nombre
  ),
  avatar_url = coalesce(
    p.avatar_url,
    u.raw_user_meta_data->>'foto',
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  )
from auth.users u
where p.id = u.id;
/* GESTEK — Supabase Storage para fotos de perfil.

   Crea el bucket "avatars" público de lectura. Cada usuario puede subir,
   actualizar y borrar archivos solo dentro de su carpeta /{user_id}/...

   Estructura: avatars/{user_id}/avatar.{ext}
*/

/* 1. Crear bucket público (idempotente) */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2 * 1024 * 1024, -- 2 MB max
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

/* 2. Policies — el dueño puede CRUD su carpeta; cualquiera puede leer */
drop policy if exists "avatars_public_read"   on storage.objects;
drop policy if exists "avatars_owner_insert"  on storage.objects;
drop policy if exists "avatars_owner_update"  on storage.objects;
drop policy if exists "avatars_owner_delete"  on storage.objects;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
/* GESTEK — Storage para portada y galería de eventos.

   Bucket: 'event-media' — público de lectura.
   Estructura: event-media/{owner_id}/{event_slug_o_id}/{cover|gallery}-{timestamp}.{ext}

   El owner del evento (auth.uid()) es el único que puede subir/editar/borrar
   archivos en su carpeta. Cualquiera puede leer (porque las páginas públicas
   de eventos necesitan mostrarlas sin auth).

   Además: agregamos columna `gallery jsonb` a eventos para almacenar el
   arreglo de URLs ordenadas.
*/

/* 1. Bucket */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-media',
  'event-media',
  true,
  5 * 1024 * 1024, -- 5 MB max por imagen
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

/* 2. Policies */
drop policy if exists "event_media_public_read"   on storage.objects;
drop policy if exists "event_media_owner_insert"  on storage.objects;
drop policy if exists "event_media_owner_update"  on storage.objects;
drop policy if exists "event_media_owner_delete"  on storage.objects;

create policy "event_media_public_read" on storage.objects
  for select using (bucket_id = 'event-media');

create policy "event_media_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'event-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "event_media_owner_update" on storage.objects
  for update using (
    bucket_id = 'event-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "event_media_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'event-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

/* 3. Columna gallery en eventos */
alter table public.eventos
  add column if not exists gallery jsonb not null default '[]'::jsonb;

/* Ejemplo de gallery:
   ["https://.../event-media/<owner>/<event>/gallery-1.jpg",
    "https://.../event-media/<owner>/<event>/gallery-2.jpg"]
*/
/* GESTEK — Equipo y roles por evento.

   Cada evento puede tener varios miembros (staff). Cada miembro tiene un rol
   con permisos. Los roles vienen como string (preset) pero el modelo permite
   custom_permissions para granularidad.

   Flujo de invitación:
   - Owner invita por email
   - Si el email ya tiene cuenta GESTEK → user_id se llena, status='active'
   - Si no → user_id null, status='invited', se completa al aceptar la invitación
*/

create table if not exists public.event_members (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references public.eventos(id) on delete cascade,

  /* Datos del miembro — user_id null = invitado aún sin registrar */
  user_id     uuid references public.profiles(id) on delete set null,
  email       text not null,
  nombre_invitado text,

  /* Rol del miembro DENTRO de este evento */
  rol         text not null default 'staff',  -- owner | editor | coordinador | staff_acceso | staff_logistica | staff_atencion | vip_host | staff
  custom_permissions text[] default '{}',     -- permisos extra para granularidad

  /* Estado de la invitación */
  status      text not null default 'invited', -- invited | active | rejected | removed
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,

  /* Quién lo invitó */
  invited_by  uuid references public.profiles(id),

  unique (evento_id, email)
);

create index if not exists event_members_evento_idx on public.event_members (evento_id);
create index if not exists event_members_user_idx   on public.event_members (user_id) where user_id is not null;
create index if not exists event_members_email_idx  on public.event_members (lower(email));

/* RLS — el owner del evento gestiona; los miembros leen su propio rol */
alter table public.event_members enable row level security;

drop policy if exists event_members_select_owner_or_self on public.event_members;
create policy event_members_select_owner_or_self on public.event_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.eventos e where e.id = event_members.evento_id and e.owner_id = auth.uid())
  );

drop policy if exists event_members_write_owner on public.event_members;
create policy event_members_write_owner on public.event_members
  for all using (
    exists (select 1 from public.eventos e where e.id = event_members.evento_id and e.owner_id = auth.uid())
  );

/* Permite al usuario invitado actualizar su propia fila (para aceptar/rechazar) */
drop policy if exists event_members_update_self on public.event_members;
create policy event_members_update_self on public.event_members
  for update using (user_id = auth.uid());

/* Cuando un usuario nuevo se registra, completar event_members donde estaba invitado por email */
create or replace function public.link_event_invitations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.event_members
    set user_id = new.id, status = 'active', accepted_at = now()
    where lower(email) = lower(new.email)
      and user_id is null
      and status = 'invited';
  return new;
end;
$$;

drop trigger if exists on_new_user_link_invites on auth.users;
create trigger on_new_user_link_invites
  after insert on auth.users
  for each row execute function public.link_event_invitations();
/* GESTEK — Roles definidos por evento.

   El organizador define los roles ANTES de invitar. Cada evento arranca con
   un set de roles preset (editables/borrables) y puede crear nuevos.
   event_members.rol_id apunta al rol seleccionado.
*/

create table if not exists public.event_roles (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references public.eventos(id) on delete cascade,
  nombre      text not null,
  descripcion text,
  permissions jsonb not null default '[]'::jsonb,
  is_system   boolean not null default false,
  orden       integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (evento_id, nombre)
);

create index if not exists event_roles_evento_idx on public.event_roles (evento_id);

/* event_members ya existe — agregamos rol_id como FK */
alter table public.event_members
  add column if not exists rol_id uuid references public.event_roles(id) on delete set null;

/* RLS */
alter table public.event_roles enable row level security;

drop policy if exists event_roles_select on public.event_roles;
create policy event_roles_select on public.event_roles
  for select using (
    exists (select 1 from public.eventos e where e.id = event_roles.evento_id and e.owner_id = auth.uid())
    or exists (
      select 1 from public.event_members m
      where m.evento_id = event_roles.evento_id and m.user_id = auth.uid() and m.status = 'active'
    )
  );

drop policy if exists event_roles_write_owner on public.event_roles;
create policy event_roles_write_owner on public.event_roles
  for all using (
    exists (select 1 from public.eventos e where e.id = event_roles.evento_id and e.owner_id = auth.uid())
  );

/* Trigger: seed defaults cuando se crea un evento nuevo */
create or replace function public.seed_event_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_roles (evento_id, nombre, descripcion, permissions, is_system, orden) values
    (new.id, 'Editor',           'Edita información, agenda y página pública',     '["edit_event","view"]'::jsonb,             true, 1),
    (new.id, 'Coordinador',      'Coordina al staff y al evento completo',         '["edit_event","invite_staff","view"]'::jsonb, true, 2),
    (new.id, 'Staff · Acceso',   'Controla entrada y hace check-in con QR',        '["checkin","view"]'::jsonb,                true, 3),
    (new.id, 'Staff · Logística','Montaje, técnica y escenario',                    '["view","internal_chat"]'::jsonb,          true, 4),
    (new.id, 'Staff · Atención', 'Atiende asistentes durante el evento',           '["view","attendee_lookup"]'::jsonb,        true, 5),
    (new.id, 'VIP host',         'Anfitrión de zona VIP',                          '["view","vip_zone"]'::jsonb,               true, 6);
  return new;
end;
$$;

drop trigger if exists trg_seed_event_roles on public.eventos;
create trigger trg_seed_event_roles
  after insert on public.eventos
  for each row execute function public.seed_event_roles();

/* Backfill: eventos existentes también reciben sus roles default */
do $$
declare e record;
begin
  for e in select id from public.eventos where deleted_at is null loop
    if not exists (select 1 from public.event_roles where evento_id = e.id) then
      insert into public.event_roles (evento_id, nombre, descripcion, permissions, is_system, orden) values
        (e.id, 'Editor',           'Edita información, agenda y página pública',     '["edit_event","view"]'::jsonb,             true, 1),
        (e.id, 'Coordinador',      'Coordina al staff y al evento completo',         '["edit_event","invite_staff","view"]'::jsonb, true, 2),
        (e.id, 'Staff · Acceso',   'Controla entrada y hace check-in con QR',        '["checkin","view"]'::jsonb,                true, 3),
        (e.id, 'Staff · Logística','Montaje, técnica y escenario',                    '["view","internal_chat"]'::jsonb,          true, 4),
        (e.id, 'Staff · Atención', 'Atiende asistentes durante el evento',           '["view","attendee_lookup"]'::jsonb,        true, 5),
        (e.id, 'VIP host',         'Anfitrión de zona VIP',                          '["view","vip_zone"]'::jsonb,               true, 6);
    end if;
  end loop;
end$$;
/* GESTEK — Chat interno por evento.

   Las tablas chat_channels y chat_messages ya existen (0001_init.sql).
   Esto agrega:
   - Trigger que siembra 4 canales default al crear evento
   - Backfill para eventos existentes
   - Habilita Realtime sobre chat_messages
*/

create or replace function public.seed_chat_channels()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.chat_channels (evento_id, nombre, tipo, created_by) values
    (new.id, 'General',   'general', new.owner_id),
    (new.id, 'Acceso',    'staff',   new.owner_id),
    (new.id, 'Logística', 'staff',   new.owner_id),
    (new.id, 'Atención',  'staff',   new.owner_id);
  return new;
end;
$$;

drop trigger if exists trg_seed_chat_channels on public.eventos;
create trigger trg_seed_chat_channels
  after insert on public.eventos
  for each row execute function public.seed_chat_channels();

/* Backfill */
do $$
declare e record;
begin
  for e in select id, owner_id from public.eventos where deleted_at is null loop
    if not exists (select 1 from public.chat_channels where evento_id = e.id) then
      insert into public.chat_channels (evento_id, nombre, tipo, created_by) values
        (e.id, 'General',   'general', e.owner_id),
        (e.id, 'Acceso',    'staff',   e.owner_id),
        (e.id, 'Logística', 'staff',   e.owner_id),
        (e.id, 'Atención',  'staff',   e.owner_id);
    end if;
  end loop;
end$$;

/* Habilitar Realtime sobre chat_messages (idempotente) */
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.chat_messages';
  end if;
end$$;
/* GESTEK — Chat: subgrupos + permisos consistentes en roles default. */

/* 1. Subgrupos en chat_channels */
alter table public.chat_channels
  add column if not exists parent_id uuid references public.chat_channels(id) on delete cascade,
  add column if not exists orden integer not null default 0;

create index if not exists chat_channels_parent_idx on public.chat_channels(parent_id);

/* 2. Actualizar permisos de los roles default existentes para que usen las
   keys del nuevo catálogo. Los roles existentes pueden tener permisos viejos. */
update public.event_roles set permissions = '["editar_evento","editar_pagina_publica","ver_clientes","crear_canales"]'::jsonb
  where is_system and nombre = 'Editor';
update public.event_roles set permissions = '["editar_evento","invitar_staff","ver_clientes","crear_canales","gestionar_tickets","ver_pagos"]'::jsonb
  where is_system and nombre = 'Coordinador';
update public.event_roles set permissions = '["checkin","ver_clientes"]'::jsonb
  where is_system and nombre = 'Staff · Acceso';
update public.event_roles set permissions = '["ver_clientes"]'::jsonb
  where is_system and nombre = 'Staff · Logística';
update public.event_roles set permissions = '["ver_clientes","gestionar_clientes"]'::jsonb
  where is_system and nombre = 'Staff · Atención';
update public.event_roles set permissions = '["vip_zone","ver_clientes"]'::jsonb
  where is_system and nombre = 'VIP host';

/* 3. Actualizar el trigger seed_event_roles para futuros eventos */
create or replace function public.seed_event_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_roles (evento_id, nombre, descripcion, permissions, is_system, orden) values
    (new.id, 'Editor',           'Edita información, agenda y página pública',
       '["editar_evento","editar_pagina_publica","ver_clientes","crear_canales"]'::jsonb,                          true, 1),
    (new.id, 'Coordinador',      'Coordina al staff y al evento completo',
       '["editar_evento","invitar_staff","ver_clientes","crear_canales","gestionar_tickets","ver_pagos"]'::jsonb,  true, 2),
    (new.id, 'Staff · Acceso',   'Controla entrada y hace check-in con QR',
       '["checkin","ver_clientes"]'::jsonb,                                                                       true, 3),
    (new.id, 'Staff · Logística','Montaje, técnica y escenario',
       '["ver_clientes"]'::jsonb,                                                                                 true, 4),
    (new.id, 'Staff · Atención', 'Atiende asistentes durante el evento',
       '["ver_clientes","gestionar_clientes"]'::jsonb,                                                            true, 5),
    (new.id, 'VIP host',         'Anfitrión de zona VIP',
       '["vip_zone","ver_clientes"]'::jsonb,                                                                      true, 6);
  return new;
end;
$$;
/* GESTEK — page_json v2 con múltiples páginas y bloques sistema.

   Estructura nueva:
   {
     "pages": [
       {
         "id"    : "p_inicio",
         "nombre": "Inicio",
         "blocks": [
           { "id": "sys_portada",    "type": "portada",    "data": {} },
           { "id": "sys_titulo",     "type": "titulo",     "data": {} },
           { "id": "sys_descripcion","type": "descripcion","data": {} },
           { "id": "sys_info",       "type": "info",       "data": {} },
           { "id": "sys_direccion",  "type": "direccion",  "data": {} },
           { "id": "sys_links",      "type": "links",      "data": {} },
           { "id": "sys_tickets",    "type": "tickets",    "data": {} }
         ]
       }
     ]
   }

   Bloques sistema: leen su contenido del evento (cover_url, gallery, titulo,
   descripcion, fechas, links, tipos_ticket). El usuario puede ocultarlos
   (data.oculto = true), reordenarlos y duplicarlos.

   Bloques custom: texto, galeria, video, faq (su contenido vive en data).
*/

create or replace function public.default_page_blocks()
returns jsonb language sql as $$
  select jsonb_build_array(
    jsonb_build_object('id', 'sys_portada',    'type', 'portada',     'data', '{}'::jsonb),
    jsonb_build_object('id', 'sys_titulo',     'type', 'titulo',      'data', '{}'::jsonb),
    jsonb_build_object('id', 'sys_descripcion','type', 'descripcion', 'data', '{}'::jsonb),
    jsonb_build_object('id', 'sys_info',       'type', 'info',        'data', '{}'::jsonb),
    jsonb_build_object('id', 'sys_direccion',  'type', 'direccion',   'data', '{}'::jsonb),
    jsonb_build_object('id', 'sys_links',      'type', 'links',       'data', '{}'::jsonb),
    jsonb_build_object('id', 'sys_tickets',    'type', 'tickets',     'data', '{}'::jsonb)
  );
$$;

create or replace function public.seed_page_json_v2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.page_json is null or new.page_json = '{}'::jsonb or new.page_json->'pages' is null then
    new.page_json := jsonb_build_object(
      'pages', jsonb_build_array(
        jsonb_build_object(
          'id',     'p_inicio',
          'nombre', 'Inicio',
          'blocks', public.default_page_blocks()
        )
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_seed_page_json on public.eventos;
create trigger trg_seed_page_json
  before insert on public.eventos
  for each row execute function public.seed_page_json_v2();

/* Backfill: convierte eventos existentes a la estructura v2.
   Si tenían blocks viejos en page_json.blocks, los preserva al final. */
update public.eventos
set page_json = jsonb_build_object(
  'pages', jsonb_build_array(
    jsonb_build_object(
      'id',     'p_inicio',
      'nombre', 'Inicio',
      'blocks', public.default_page_blocks() || coalesce(page_json->'blocks', '[]'::jsonb)
    )
  )
)
where deleted_at is null
  and (page_json is null or page_json->'pages' is null);
/* GESTEK — Restricciones de canales por rol + branding del organizador. */

/* 1. Canales pueden ser restringidos a uno o más roles del evento.
   rol_ids = [] significa "abierto a todos los miembros del evento". */
alter table public.chat_channels
  add column if not exists rol_ids uuid[] not null default '{}';

create index if not exists chat_channels_rol_ids_idx on public.chat_channels using gin (rol_ids);

/* 2. White-label / branding del organizador.
   logo_url para reemplazar el logo GESTEK en sus páginas (cuando hagamos Pro).
   branding jsonb guarda colores y otras prefs. */
alter table public.profiles
  add column if not exists empresa_logo_url text,
  add column if not exists branding jsonb not null default '{}'::jsonb;
/* GESTEK — Sincroniza profiles.avatar_url y profiles.nombre cuando el
   usuario actualiza su user_metadata vía Supabase Auth.

   Sin esto, cuando el usuario sube una foto nueva via Settings, el
   user_metadata se actualiza pero el avatar_url del profile queda viejo —
   por eso los avatares no aparecen en chat/equipo/clientes. */

create or replace function public.sync_profile_from_auth_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  old_meta jsonb := coalesce(old.raw_user_meta_data, '{}'::jsonb);
begin
  if new_meta is distinct from old_meta then
    update public.profiles set
      nombre = coalesce(
        new_meta->>'nombre',
        new_meta->>'full_name',
        new_meta->>'name',
        profiles.nombre
      ),
      avatar_url = coalesce(
        new_meta->>'foto',
        new_meta->>'avatar_url',
        new_meta->>'picture',
        profiles.avatar_url
      ),
      telefono  = coalesce(new_meta->>'telefono',  profiles.telefono),
      empresa   = coalesce(new_meta->>'empresa',   profiles.empresa),
      ocupacion = coalesce(new_meta->>'ocupacion', profiles.ocupacion),
      ciudad    = coalesce(new_meta->>'ciudad',    profiles.ciudad),
      updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.sync_profile_from_auth_update();

/* Backfill: sincroniza avatares y nombres desde el metadata actual */
update public.profiles p
set
  nombre = coalesce(
    u.raw_user_meta_data->>'nombre',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    p.nombre
  ),
  avatar_url = coalesce(
    u.raw_user_meta_data->>'foto',
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture',
    p.avatar_url
  )
from auth.users u
where p.id = u.id;
/* GESTEK — Tareas asignables por persona o por rol + trazabilidad. */

create table if not exists public.tareas (
  id              uuid primary key default gen_random_uuid(),
  evento_id       uuid not null references public.eventos(id) on delete cascade,
  titulo          text not null,
  descripcion     text,
  estado          text not null default 'pendiente',
    -- pendiente | en_curso | hecho | cancelada
  prioridad       text not null default 'normal',
    -- baja | normal | alta | urgente

  /* Asignación: a un usuario específico O a un rol (los miembros con ese rol la ven).
     Pueden ser ambos null si la tarea aún no fue asignada. */
  asignado_user_id uuid references public.profiles(id) on delete set null,
  asignado_rol_id  uuid references public.event_roles(id) on delete set null,

  vence_at        timestamptz,
  completed_at    timestamptz,
  orden           integer not null default 0,

  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists tareas_evento_idx       on public.tareas (evento_id);
create index if not exists tareas_estado_idx       on public.tareas (estado);
create index if not exists tareas_asignado_user_idx on public.tareas (asignado_user_id) where asignado_user_id is not null;
create index if not exists tareas_asignado_rol_idx  on public.tareas (asignado_rol_id)  where asignado_rol_id  is not null;

/* Log / trazabilidad de cada tarea */
create table if not exists public.tarea_log (
  id          uuid primary key default gen_random_uuid(),
  tarea_id    uuid not null references public.tareas(id) on delete cascade,
  user_id     uuid references public.profiles(id),
  tipo        text not null,
    -- created | estado | asignacion | comentario | completed | vence | borrada
  contenido   jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists tarea_log_tarea_idx on public.tarea_log (tarea_id, created_at desc);

/* updated_at trigger en tareas */
drop trigger if exists trg_tareas_updated on public.tareas;
create trigger trg_tareas_updated before update on public.tareas
  for each row execute function public.set_updated_at();

/* RLS */
alter table public.tareas    enable row level security;
alter table public.tarea_log enable row level security;

/* Tareas: owner del evento gestiona; miembros activos ven las tareas
   asignadas a su rol o a ellos mismos. */
drop policy if exists tareas_select on public.tareas;
create policy tareas_select on public.tareas
  for select using (
    exists (select 1 from public.eventos e where e.id = tareas.evento_id and e.owner_id = auth.uid())
    or asignado_user_id = auth.uid()
    or exists (
      select 1 from public.event_members m
      where m.evento_id = tareas.evento_id and m.user_id = auth.uid() and m.status = 'active'
        and (tareas.asignado_rol_id is null or m.rol_id = tareas.asignado_rol_id)
    )
  );

drop policy if exists tareas_write_owner on public.tareas;
create policy tareas_write_owner on public.tareas
  for all using (
    exists (select 1 from public.eventos e where e.id = tareas.evento_id and e.owner_id = auth.uid())
  );

/* log: lectura igual que tareas */
drop policy if exists tarea_log_select on public.tarea_log;
create policy tarea_log_select on public.tarea_log
  for select using (
    exists (
      select 1 from public.tareas t
      join public.eventos e on e.id = t.evento_id
      where t.id = tarea_log.tarea_id and (
        e.owner_id = auth.uid()
        or t.asignado_user_id = auth.uid()
        or exists (
          select 1 from public.event_members m
          where m.evento_id = e.id and m.user_id = auth.uid() and m.status = 'active'
            and (t.asignado_rol_id is null or m.rol_id = t.asignado_rol_id)
        )
      )
    )
  );

/* ─────────── Storage: permitir audio en event-media ─────────── */
update storage.buckets
  set allowed_mime_types = array[
    'image/jpeg','image/png','image/webp','image/gif',
    'audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav'
  ]
  where id = 'event-media';
/* GESTEK — Integración Mercado Pago.
   Cada organizador conecta SU cuenta MP (marketplace mode no, por simplicidad
   directo con las credenciales del owner). Guardamos sus credenciales en profiles
   y registramos cada transacción para conciliar con webhooks. */

alter table public.profiles
  add column if not exists mp_user_id      text,
  add column if not exists mp_access_token text,
  add column if not exists mp_public_key   text,
  add column if not exists mp_connected_at timestamptz;

/* Tabla para correlacionar pagos con tickets y procesar webhooks idempotentemente */
create table if not exists public.payment_transactions (
  id              uuid primary key default gen_random_uuid(),
  evento_id       uuid not null references public.eventos(id) on delete cascade,
  ticket_id       uuid references public.tickets(id) on delete set null,
  ticket_type_id  uuid references public.ticket_types(id) on delete set null,

  provider        text not null default 'mercadopago',
  /* preference_id devuelto al crear la preferencia (antes del pago) */
  preference_id   text,
  /* payment_id devuelto por el webhook cuando el pago se procesa */
  payment_id      text,
  status          text not null default 'pending',
    -- pending | approved | rejected | refunded | cancelled

  monto           numeric(12,2),
  currency        text default 'COP',

  guest_email     text,
  guest_nombre    text,
  guest_telefono  text,

  raw             jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists payment_tx_evento_idx     on public.payment_transactions (evento_id);
create index if not exists payment_tx_preference_idx on public.payment_transactions (preference_id);
create index if not exists payment_tx_payment_idx    on public.payment_transactions (payment_id);

drop trigger if exists trg_payment_tx_updated on public.payment_transactions;
create trigger trg_payment_tx_updated before update on public.payment_transactions
  for each row execute function public.set_updated_at();

alter table public.payment_transactions enable row level security;

/* Solo el owner del evento ve sus transacciones */
drop policy if exists payment_tx_select_owner on public.payment_transactions;
create policy payment_tx_select_owner on public.payment_transactions
  for select using (
    exists (select 1 from public.eventos e where e.id = payment_transactions.evento_id and e.owner_id = auth.uid())
  );
/* GESTEK — Plan Pro pagado vía Mercado Pago (cuenta GESTEK como receptor). */

alter table public.profiles
  add column if not exists plan              text not null default 'free',
    -- free | pro
  add column if not exists plan_expires_at   timestamptz,
  add column if not exists plan_payment_id   text,
  add column if not exists plan_updated_at   timestamptz;

/* Marcador en payment_transactions para distinguir compras de plan vs tickets.
   Para planes ticket_id e evento_id quedan null y guardamos user_id. */
alter table public.payment_transactions
  add column if not exists user_id  uuid references public.profiles(id) on delete set null,
  add column if not exists kind     text not null default 'ticket';
    -- ticket | plan

create index if not exists payment_tx_user_idx on public.payment_transactions (user_id) where user_id is not null;

/* La policy actual de payment_transactions filtra por evento.owner_id, así que
   las filas de plan no las vería el dueño. Agregamos una alternativa para que
   cada user vea sus propias compras de plan. */
drop policy if exists payment_tx_select_self_plan on public.payment_transactions;
create policy payment_tx_select_self_plan on public.payment_transactions
  for select using (
    user_id = auth.uid()
  );
/* GESTEK — Analytics ligero: tracking de visitas a páginas públicas.
   Una fila por visita. visitor_hash agrupa "mismo visitante en el mismo día"
   (hash de IP + UA + día), no es PII trackeada. */

create table if not exists public.event_views (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references public.eventos(id) on delete cascade,
  visitor_hash  text not null,
  referrer      text,
  source        text,
    -- direct | search | social | email | otro
  user_agent    text,
  pais          text,
  created_at    timestamptz not null default now()
);

create index if not exists event_views_evento_idx   on public.event_views (evento_id, created_at desc);
create index if not exists event_views_visitor_idx  on public.event_views (evento_id, visitor_hash, created_at);

/* RLS: owner del evento ve sus stats. Insert lo hace el backend con service_role. */
alter table public.event_views enable row level security;

drop policy if exists event_views_select_owner on public.event_views;
create policy event_views_select_owner on public.event_views
  for select using (
    exists (select 1 from public.eventos e where e.id = event_views.evento_id and e.owner_id = auth.uid())
  );
/* GESTEK — Recordatorios email automáticos (T-7d / T-1d / T-1h).

   Flujo:
   1. Cada evento decide si quiere recordatorios (eventos.email_reminders default true).
   2. Una Edge Function `send-reminders` corre cada hora vía pg_cron.
   3. La función usa find_pending_reminders() para sacar la lista de envíos pendientes.
   4. Por cada uno, manda email vía Resend y registra en email_log (idempotente).
*/

alter table public.eventos
  add column if not exists email_reminders boolean not null default true;

create table if not exists public.email_log (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets(id) on delete cascade,
  evento_id   uuid not null references public.eventos(id) on delete cascade,
  tipo        text not null,
    -- t7d | t1d | t1h | confirmacion | post_evento
  destinatario text not null,
  status      text not null default 'sent',
    -- sent | failed
  error       text,
  created_at  timestamptz not null default now()
);

create unique index if not exists email_log_unique on public.email_log (ticket_id, tipo);
create index if not exists email_log_evento_idx   on public.email_log (evento_id, created_at desc);

alter table public.email_log enable row level security;

drop policy if exists email_log_select_owner on public.email_log;
create policy email_log_select_owner on public.email_log
  for select using (
    exists (select 1 from public.eventos e where e.id = email_log.evento_id and e.owner_id = auth.uid())
  );

/* Encuentra los próximos N envíos pendientes.
   Devuelve filas con todo lo que la Edge Function necesita para mandar el email.
   Ventanas:
     - t7d : 7 días - 30min  →  7 días + 30min
     - t1d : 24h - 30min     →  24h + 30min
     - t1h : 1h - 15min      →  1h + 15min
   Solo tickets en estado 'pagado' y eventos con email_reminders=true.
*/
create or replace function public.find_pending_reminders(p_limit int default 200)
returns table (
  ticket_id     uuid,
  evento_id     uuid,
  tipo          text,
  guest_email   text,
  guest_nombre  text,
  codigo        text,
  qr_token      text,
  evento_titulo text,
  evento_inicio timestamptz,
  evento_location text,
  evento_slug   text,
  owner_nombre  text,
  owner_empresa text
)
language sql security definer set search_path = public as $$
  with candidatos as (
    select
      t.id as ticket_id, t.evento_id, t.guest_email, t.guest_nombre, t.codigo, t.qr_token,
      e.titulo as evento_titulo, e.fecha_inicio as evento_inicio,
      coalesce(e.location_nombre, e.location_direccion) as evento_location,
      e.slug as evento_slug,
      p.nombre as owner_nombre, p.empresa as owner_empresa,
      case
        when e.fecha_inicio between now() + interval '6 days 23 hours 30 minutes' and now() + interval '7 days 30 minutes' then 't7d'
        when e.fecha_inicio between now() + interval '23 hours 30 minutes'         and now() + interval '24 hours 30 minutes' then 't1d'
        when e.fecha_inicio between now() + interval '45 minutes'                  and now() + interval '1 hour 15 minutes'   then 't1h'
        else null
      end as tipo
    from public.tickets t
    join public.eventos e  on e.id = t.evento_id
    join public.profiles p on p.id = e.owner_id
    where t.estado = 'pagado'
      and e.email_reminders = true
      and e.deleted_at is null
      and e.estado = 'publicado'
      and t.guest_email is not null
  )
  select
    c.ticket_id, c.evento_id, c.tipo,
    c.guest_email, c.guest_nombre, c.codigo, c.qr_token,
    c.evento_titulo, c.evento_inicio, c.evento_location, c.evento_slug,
    c.owner_nombre, c.owner_empresa
  from candidatos c
  where c.tipo is not null
    and not exists (
      select 1 from public.email_log l
      where l.ticket_id = c.ticket_id and l.tipo = c.tipo
    )
  order by c.evento_inicio asc
  limit p_limit;
$$;
/* GESTEK — Web push subscriptions.
   Cada dispositivo/browser que opta-in genera una PushSubscription única.
   La identificamos por endpoint. */

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  endpoint    text not null,
  keys        jsonb not null, -- { p256dh, auth }
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists push_subs_endpoint_idx on public.push_subscriptions (endpoint);
create index if not exists push_subs_user_idx           on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

/* El backend usa service_role para enviar, así que las policies son simples:
   el dueño ve y borra las suyas. */
drop policy if exists push_subs_self on public.push_subscriptions;
create policy push_subs_self on public.push_subscriptions
  for all using (user_id = auth.uid());
/* GESTEK — Pago manual / simple por evento.
   El organizador pega su llave/alias MP y/o sube imagen de QR. El asistente paga
   off-platform y el organizador verifica manualmente desde el panel.
   No reemplaza la integración MP completa (vía profiles.mp_access_token); coexiste. */

alter table public.eventos
  add column if not exists pago_llave         text,
  add column if not exists pago_qr_url        text,
  add column if not exists pago_instrucciones text;
-- GESTEK — Migraciones pendientes 0020→0028 (combinadas)
-- Pega TODO esto en Supabase → SQL Editor → Run (una sola vez).
-- Idempotente: usa create table if not exists. Orden respetado.

begin;


-- ════════════════════════════════════════════════════════════
-- 0020_waitlist.sql
-- ════════════════════════════════════════════════════════════
-- 0020: Lista de espera por tipo de boleta
-- Permite a usuarios unirse a una cola cuando el cupo está agotado.

create table if not exists public.event_waitlist (
  id                    uuid primary key default gen_random_uuid(),
  evento_id             uuid not null references public.eventos(id) on delete cascade,
  ticket_type_id        uuid not null references public.ticket_types(id) on delete cascade,

  user_id               uuid references public.profiles(id) on delete set null,
  guest_email           text not null,
  guest_nombre          text,

  posicion              integer not null,

  estado                text not null default 'active',
  -- active | contacted | purchased | cancelled

  added_at              timestamptz not null default now(),
  notified_at           timestamptz,
  purchased_at          timestamptz,

  notification_attempts integer not null default 0,
  last_contact_at       timestamptz,

  unique (evento_id, ticket_type_id, guest_email)
);

create index if not exists waitlist_evento_idx    on public.event_waitlist (evento_id);
create index if not exists waitlist_tipo_idx      on public.event_waitlist (ticket_type_id);
create index if not exists waitlist_estado_idx    on public.event_waitlist (estado);
create index if not exists waitlist_posicion_idx  on public.event_waitlist (evento_id, ticket_type_id, posicion);


-- ════════════════════════════════════════════════════════════
-- 0021_notificaciones.sql
-- ════════════════════════════════════════════════════════════
/* GESTEK — Notificaciones in-app.
   Una fila por notificación a un usuario. El backend las crea (service_role)
   desde puntos clave (reserva, alta a equipo, tarea asignada, etc).
   El frontend las lee + escucha vía Supabase Realtime. */

create table if not exists public.notificaciones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tipo        text not null default 'info',
    -- info | reserva | equipo | tarea | pago | sistema
  titulo      text not null,
  cuerpo      text,
  link        text,                       -- ruta interna a la que navega al click
  evento_id   uuid references public.eventos(id) on delete cascade,
  leida       boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notif_user_idx
  on public.notificaciones (user_id, created_at desc);
create index if not exists notif_user_unread_idx
  on public.notificaciones (user_id) where leida = false;

alter table public.notificaciones enable row level security;

/* Cada usuario ve y marca como leídas SOLO las suyas.
   El insert lo hace el backend con service_role (bypassa RLS). */
drop policy if exists notif_select_own on public.notificaciones;
create policy notif_select_own on public.notificaciones
  for select using (user_id = auth.uid());

drop policy if exists notif_update_own on public.notificaciones;
create policy notif_update_own on public.notificaciones
  for update using (user_id = auth.uid());

drop policy if exists notif_delete_own on public.notificaciones;
create policy notif_delete_own on public.notificaciones
  for delete using (user_id = auth.uid());

/* Realtime sobre notificaciones (idempotente) */
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificaciones'
  ) then
    execute 'alter publication supabase_realtime add table public.notificaciones';
  end if;
end$$;


-- ════════════════════════════════════════════════════════════
-- 0022_gamificacion.sql
-- ════════════════════════════════════════════════════════════
/* GESTEK — Gamificación.
   Las tablas points_log / user_badges / missions ya existen (0001_init.sql).
   Esto agrega:
   - profiles.puntos_total : cache del total (para ranking sin agregaciones caras)
   - Backfill del cache desde points_log
   - RLS extra para que el ranking sea legible por usuarios autenticados
*/

alter table public.profiles
  add column if not exists puntos_total integer not null default 0;

/* Backfill: suma histórica de points_log a la cache */
update public.profiles p
set puntos_total = coalesce((
  select sum(pl.puntos) from public.points_log pl where pl.user_id = p.id
), 0);

create index if not exists profiles_puntos_idx
  on public.profiles (puntos_total desc) where puntos_total > 0;

/* Ranking: cualquier usuario autenticado puede leer nombre+avatar+puntos
   de los demás (solo esas columnas, vía la policy de abajo no — RLS es a nivel
   fila, no columna). Para no exponer todo el profile, el backend usa
   service_role y selecciona solo columnas públicas. Dejamos la policy
   existente intacta; el ranking se sirve desde el backend. */

/* user_badges: permitir que el dueño vea las suyas ya está en 0001.
   Agregamos índice para el conteo por usuario. */
create index if not exists user_badges_user_idx
  on public.user_badges (user_id);


-- ════════════════════════════════════════════════════════════
-- 0023_recordatorios_inapp.sql
-- ════════════════════════════════════════════════════════════
/* GESTEK — Recordatorios in-app (T-7d / T-1d / T-1h).
   A diferencia de los recordatorios por email (Edge Function + Resend), estos
   son notificaciones internas: solo insertan filas en `notificaciones`, así que
   pg_cron puede llamar una función SQL pura sin Edge Function ni provider.

   Destinatarios:
   - Owner del evento + miembros activos del equipo.
   - Asistentes con cuenta (tickets.user_id no null) y ticket pagado/usado.

   Idempotencia: tabla recordatorio_inapp_log con unique (scope_id, evento_id, tipo).
*/

create table if not exists public.recordatorio_inapp_log (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references public.eventos(id) on delete cascade,
  scope_id    uuid not null,            -- user_id destinatario
  tipo        text not null,            -- t7d | t1d | t1h
  created_at  timestamptz not null default now(),
  unique (scope_id, evento_id, tipo)
);

create index if not exists rec_inapp_log_evento_idx
  on public.recordatorio_inapp_log (evento_id);

/* Genera recordatorios in-app pendientes. Devuelve cuántas notificaciones creó.
   Llamable por pg_cron: select public.generar_recordatorios_inapp(); */
create or replace function public.generar_recordatorios_inapp()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creadas integer := 0;
  v_rec record;
  v_tipo text;
  v_label text;
begin
  for v_rec in
    with eventos_proximos as (
      select
        e.id as evento_id, e.titulo, e.owner_id, e.slug, e.fecha_inicio,
        case
          when e.fecha_inicio between now() + interval '6 days 23 hours' and now() + interval '7 days 1 hour' then 't7d'
          when e.fecha_inicio between now() + interval '23 hours'         and now() + interval '25 hours'         then 't1d'
          when e.fecha_inicio between now() + interval '45 minutes'       and now() + interval '1 hour 15 minutes' then 't1h'
          else null
        end as tipo
      from public.eventos e
      where e.estado = 'publicado'
        and e.deleted_at is null
        and e.email_reminders = true
    ),
    destinatarios as (
      /* Owner */
      select ep.evento_id, ep.titulo, ep.slug, ep.tipo, ep.owner_id as user_id
      from eventos_proximos ep where ep.tipo is not null
      union
      /* Equipo activo */
      select ep.evento_id, ep.titulo, ep.slug, ep.tipo, m.user_id
      from eventos_proximos ep
      join public.event_members m on m.evento_id = ep.evento_id and m.status = 'active' and m.user_id is not null
      where ep.tipo is not null
      union
      /* Asistentes con cuenta y ticket válido */
      select ep.evento_id, ep.titulo, ep.slug, ep.tipo, t.user_id
      from eventos_proximos ep
      join public.tickets t on t.evento_id = ep.evento_id and t.user_id is not null
        and t.estado in ('pagado', 'usado')
      where ep.tipo is not null
    )
    select distinct d.evento_id, d.titulo, d.slug, d.tipo, d.user_id
    from destinatarios d
    where not exists (
      select 1 from public.recordatorio_inapp_log l
      where l.scope_id = d.user_id and l.evento_id = d.evento_id and l.tipo = d.tipo
    )
  loop
    v_tipo := v_rec.tipo;
    v_label := case v_tipo
      when 't7d' then 'en 7 días'
      when 't1d' then 'mañana'
      when 't1h' then 'en 1 hora'
      else 'pronto'
    end;

    insert into public.notificaciones (user_id, tipo, titulo, cuerpo, link, evento_id)
    values (
      v_rec.user_id,
      'sistema',
      'Recordatorio: ' || v_rec.titulo,
      'El evento empieza ' || v_label || '.',
      '/explorar/' || v_rec.slug,
      v_rec.evento_id
    );

    insert into public.recordatorio_inapp_log (evento_id, scope_id, tipo)
    values (v_rec.evento_id, v_rec.user_id, v_tipo);

    v_creadas := v_creadas + 1;
  end loop;

  return v_creadas;
end$$;

/* Permisos: el service_role / postgres puede ejecutarla. RLS no aplica a
   security definer functions. */


-- ════════════════════════════════════════════════════════════
-- 0024_loyalty_recompensas.sql
-- ════════════════════════════════════════════════════════════
/* GESTEK — Fidelidad y recompensas escopadas por organizador.

   Dos audiencias:
   - 'cliente'  : asistente con cuenta que acumula puntos con un organizador
                  asistiendo a sus eventos. Canjea recompensas que ese
                  organizador define. Canje = código automático.
   - 'empleado' : miembro del equipo que acumula puntos trabajando (tareas,
                  check-ins). Ranking global del organizador + por evento.

   points_log (0001) se extiende con organizador_id + audiencia para atribución.
*/

alter table public.points_log
  add column if not exists organizador_id uuid references public.profiles(id) on delete set null,
  add column if not exists audiencia      text not null default 'cliente';
    -- cliente | empleado

create index if not exists points_log_org_aud_idx
  on public.points_log (organizador_id, audiencia, user_id);
create index if not exists points_log_evento_aud_idx
  on public.points_log (evento_id, audiencia) where evento_id is not null;

/* Balance cacheado por (usuario, organizador, audiencia). Es la fuente para
   ranking global y para el saldo canjeable del cliente. */
create table if not exists public.puntos_balance (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  organizador_id uuid not null references public.profiles(id) on delete cascade,
  audiencia      text not null,                     -- cliente | empleado
  puntos         integer not null default 0,
  updated_at     timestamptz not null default now(),
  unique (user_id, organizador_id, audiencia)
);

create index if not exists puntos_balance_rank_idx
  on public.puntos_balance (organizador_id, audiencia, puntos desc);

/* Recompensas que define un organizador, para una audiencia. */
create table if not exists public.recompensas (
  id             uuid primary key default gen_random_uuid(),
  organizador_id uuid not null references public.profiles(id) on delete cascade,
  audiencia      text not null,                     -- cliente | empleado
  titulo         text not null,
  descripcion    text,
  costo_puntos   integer not null check (costo_puntos > 0),
  stock          integer,                           -- null = ilimitado
  canjeados      integer not null default 0,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists recompensas_org_idx
  on public.recompensas (organizador_id, audiencia, activo);

/* Canjes realizados. Código automático (estado 'entregado' al crear). */
create table if not exists public.canjes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  organizador_id uuid not null references public.profiles(id) on delete cascade,
  recompensa_id  uuid references public.recompensas(id) on delete set null,
  audiencia      text not null,
  titulo         text not null,                     -- snapshot por si borran la recompensa
  costo_puntos   integer not null,
  codigo         text not null,
  estado         text not null default 'entregado', -- entregado | usado | cancelado
  created_at     timestamptz not null default now()
);

create unique index if not exists canjes_codigo_idx on public.canjes (codigo);
create index if not exists canjes_user_idx          on public.canjes (user_id, created_at desc);
create index if not exists canjes_org_idx           on public.canjes (organizador_id, created_at desc);

/* ── RLS ── */
alter table public.puntos_balance enable row level security;
alter table public.recompensas    enable row level security;
alter table public.canjes         enable row level security;

/* Balance: el usuario ve los suyos; el organizador ve los de su comunidad. */
drop policy if exists pb_self on public.puntos_balance;
create policy pb_self on public.puntos_balance
  for select using (user_id = auth.uid() or organizador_id = auth.uid());

/* Recompensas: el organizador gestiona las suyas; cualquiera autenticado puede
   leer las activas (para que clientes/empleados las vean). */
drop policy if exists recompensas_owner on public.recompensas;
create policy recompensas_owner on public.recompensas
  for all using (organizador_id = auth.uid());

drop policy if exists recompensas_read on public.recompensas;
create policy recompensas_read on public.recompensas
  for select using (activo = true);

/* Canjes: el usuario ve los suyos; el organizador ve los de su comunidad. */
drop policy if exists canjes_self on public.canjes;
create policy canjes_self on public.canjes
  for select using (user_id = auth.uid() or organizador_id = auth.uid());

/* Canje atómico: valida saldo, descuenta puntos, descuenta stock, registra canje.
   Devuelve el código generado o lanza excepción con mensaje claro. */
create or replace function public.canjear_recompensa(p_user uuid, p_recompensa uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec   record;
  v_saldo integer;
  v_codigo text;
begin
  select * into v_rec from public.recompensas where id = p_recompensa for update;
  if not found then raise exception 'Recompensa no encontrada.'; end if;
  if not v_rec.activo then raise exception 'Recompensa no disponible.'; end if;
  if v_rec.stock is not null and v_rec.canjeados >= v_rec.stock then
    raise exception 'Recompensa agotada.';
  end if;

  select coalesce(puntos, 0) into v_saldo
  from public.puntos_balance
  where user_id = p_user and organizador_id = v_rec.organizador_id and audiencia = v_rec.audiencia;

  if coalesce(v_saldo, 0) < v_rec.costo_puntos then
    raise exception 'Puntos insuficientes (tenés %, necesitás %).', coalesce(v_saldo,0), v_rec.costo_puntos;
  end if;

  update public.puntos_balance
    set puntos = puntos - v_rec.costo_puntos, updated_at = now()
    where user_id = p_user and organizador_id = v_rec.organizador_id and audiencia = v_rec.audiencia;

  update public.recompensas set canjeados = canjeados + 1 where id = p_recompensa;

  v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.canjes (user_id, organizador_id, recompensa_id, audiencia, titulo, costo_puntos, codigo)
  values (p_user, v_rec.organizador_id, p_recompensa, v_rec.audiencia, v_rec.titulo, v_rec.costo_puntos, v_codigo);

  return v_codigo;
end$$;


-- ════════════════════════════════════════════════════════════
-- 0025_audit_log.sql
-- ════════════════════════════════════════════════════════════
/* GESTEK — Auditoría de acciones del equipo (feature plan Pro).
   Una fila por acción relevante hecha sobre un evento: quién, qué, sobre qué
   entidad, con qué detalle. El backend escribe con service_role (best-effort);
   el owner lee desde el panel. */

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references public.eventos(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_email text,                       -- snapshot por si borran el perfil
  accion      text not null,
    -- evento.crear | evento.editar | evento.estado | evento.borrar
    -- equipo.invitar | equipo.rol | equipo.quitar
    -- rol.crear | rol.editar | rol.borrar
    -- ticket.crear | ticket.editar | ticket.borrar
  entidad     text,                       -- evento | miembro | rol | ticket | ...
  entidad_id  uuid,
  detalle     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_evento_idx
  on public.audit_log (evento_id, created_at desc);
create index if not exists audit_log_actor_idx
  on public.audit_log (actor_id) where actor_id is not null;

alter table public.audit_log enable row level security;

/* Solo el owner del evento ve su auditoría. Insert lo hace el backend
   (service_role bypassa RLS). */
drop policy if exists audit_log_owner on public.audit_log;
create policy audit_log_owner on public.audit_log
  for select using (
    exists (select 1 from public.eventos e where e.id = audit_log.evento_id and e.owner_id = auth.uid())
  );


-- ════════════════════════════════════════════════════════════
-- 0026_storage_hardening.sql
-- ════════════════════════════════════════════════════════════
/* GESTEK — Hardening de storage (auditoría de seguridad sección 3).

   Las policies de 0004 (avatars) y 0005 (event-media) ya escopan escritura por
   carpeta = auth.uid() y lectura pública. Esta migración:
   - Endurece límites de tamaño y MIME types (defensa ante uploads abusivos).
   - Re-afirma las policies de forma idempotente (estado seguro garantizado
     aunque alguien las haya tocado a mano).
   - Garantiza que NO exista escritura anónima/pública. */

/* ── Límites más conservadores ── */
update storage.buckets
  set file_size_limit = 3 * 1024 * 1024,                       -- 3 MB avatares
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif']
  where id = 'avatars';

update storage.buckets
  set file_size_limit = 15 * 1024 * 1024,                      -- 15 MB media de evento (incluye audio)
      allowed_mime_types = array[
        'image/jpeg','image/png','image/webp','image/gif','image/avif',
        'audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav'
      ]
  where id = 'event-media';

/* ── Re-afirmar policies (idempotente) ── */
do $$
begin
  /* avatars: lectura pública, escritura solo dueño de la carpeta */
  drop policy if exists "avatars_public_read"  on storage.objects;
  drop policy if exists "avatars_owner_insert" on storage.objects;
  drop policy if exists "avatars_owner_update" on storage.objects;
  drop policy if exists "avatars_owner_delete" on storage.objects;

  create policy "avatars_public_read" on storage.objects
    for select using (bucket_id = 'avatars');
  create policy "avatars_owner_insert" on storage.objects
    for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
  create policy "avatars_owner_update" on storage.objects
    for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
  create policy "avatars_owner_delete" on storage.objects
    for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

  /* event-media: igual */
  drop policy if exists "event_media_public_read"  on storage.objects;
  drop policy if exists "event_media_owner_insert" on storage.objects;
  drop policy if exists "event_media_owner_update" on storage.objects;
  drop policy if exists "event_media_owner_delete" on storage.objects;

  create policy "event_media_public_read" on storage.objects
    for select using (bucket_id = 'event-media');
  create policy "event_media_owner_insert" on storage.objects
    for insert with check (bucket_id = 'event-media' and auth.uid()::text = (storage.foldername(name))[1]);
  create policy "event_media_owner_update" on storage.objects
    for update using (bucket_id = 'event-media' and auth.uid()::text = (storage.foldername(name))[1]);
  create policy "event_media_owner_delete" on storage.objects
    for delete using (bucket_id = 'event-media' and auth.uid()::text = (storage.foldername(name))[1]);
end$$;

/* RLS en storage.objects ya viene forzada por Supabase. Las policies de insert
   exigen auth.uid(), por lo que un cliente anónimo (anon key sin sesión) NO
   puede subir archivos a ningún bucket. Lectura pública es intencional
   (avatares y covers se muestran en páginas públicas). */


-- ════════════════════════════════════════════════════════════
-- 0027_api_webhooks.sql
-- ════════════════════════════════════════════════════════════
/* GESTEK — API pública + Webhooks salientes (feature plan Pro).

   - api_tokens     : tokens Bearer del organizador. Guardamos solo el hash.
   - webhooks       : endpoints del organizador suscritos a tipos de evento.
   - webhook_deliveries : log de entregas (para debug + reintentos).
*/

create table if not exists public.api_tokens (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  nombre       text not null,
  token_hash   text not null,                 -- sha256 del token completo
  prefix       text not null,                 -- primeros chars visibles (gtk_live_ab12…)
  scopes       text[] not null default array['read'],
  last_used_at timestamptz,
  revoked      boolean not null default false,
  created_at   timestamptz not null default now()
);

create unique index if not exists api_tokens_hash_idx on public.api_tokens (token_hash);
create index if not exists api_tokens_owner_idx       on public.api_tokens (owner_id);

create table if not exists public.webhooks (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  url         text not null,
  secret      text not null,                  -- para firmar HMAC-SHA256
  eventos     text[] not null default '{}',   -- ['ticket.pagado','checkin.realizado','evento.publicado']
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists webhooks_owner_idx on public.webhooks (owner_id, activo);

create table if not exists public.webhook_deliveries (
  id           uuid primary key default gen_random_uuid(),
  webhook_id   uuid not null references public.webhooks(id) on delete cascade,
  evento_tipo  text not null,
  payload      jsonb not null,
  status       text not null default 'pending', -- pending | ok | failed
  response_code int,
  intentos     int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists wh_deliveries_idx on public.webhook_deliveries (webhook_id, created_at desc);

/* RLS — el organizador gestiona lo suyo. La API pública valida el token desde
   el backend con service_role (no usa estas policies). */
alter table public.api_tokens         enable row level security;
alter table public.webhooks           enable row level security;
alter table public.webhook_deliveries enable row level security;

drop policy if exists api_tokens_owner on public.api_tokens;
create policy api_tokens_owner on public.api_tokens
  for all using (owner_id = auth.uid());

drop policy if exists webhooks_owner on public.webhooks;
create policy webhooks_owner on public.webhooks
  for all using (owner_id = auth.uid());

drop policy if exists wh_deliveries_owner on public.webhook_deliveries;
create policy wh_deliveries_owner on public.webhook_deliveries
  for select using (
    exists (select 1 from public.webhooks w where w.id = webhook_deliveries.webhook_id and w.owner_id = auth.uid())
  );


-- ════════════════════════════════════════════════════════════
-- 0028_event_requests.sql
-- ════════════════════════════════════════════════════════════
-- GESTEK — Sugerencias / solicitudes / mensajes del equipo hacia el organizador.
-- El equipo (miembros activos) crea entradas; el organizador las gestiona.

create table if not exists public.event_requests (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references public.eventos(id) on delete cascade,
  autor_id    uuid references public.profiles(id) on delete set null,
  tipo        text not null default 'sugerencia',   -- sugerencia | solicitud | mensaje | reporte
  titulo      text,
  contenido   text not null,
  estado      text not null default 'abierta',       -- abierta | en_revision | resuelta | descartada
  respuesta   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists event_requests_evento_idx on public.event_requests (evento_id, created_at desc);
create index if not exists event_requests_autor_idx  on public.event_requests (autor_id);
create index if not exists event_requests_estado_idx on public.event_requests (evento_id) where estado <> 'resuelta';

commit;
