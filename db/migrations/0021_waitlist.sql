/* GESTEK — Listas de espera por tipo de boleta.
   Cuando un ticket_type está agotado, los interesados se anotan acá.
   El organizador (o un futuro automatismo) los promueve: pasan de 'esperando'
   a 'promovido' y reciben link para reservar. */

create table if not exists public.waitlist (
  id             uuid primary key default gen_random_uuid(),
  evento_id      uuid not null references public.eventos(id) on delete cascade,
  ticket_type_id uuid references public.ticket_types(id) on delete set null,

  guest_nombre   text not null,
  guest_email    text not null,
  guest_telefono text,

  estado         text not null default 'esperando',
    -- esperando | promovido | convertido | cancelado
  posicion       integer,                 -- orden de llegada (se calcula al insertar)
  promovido_at   timestamptz,
  ticket_id      uuid references public.tickets(id) on delete set null, -- si convirtió

  created_at     timestamptz not null default now()
);

create index if not exists waitlist_evento_idx
  on public.waitlist (evento_id, estado, created_at);
create unique index if not exists waitlist_uniq_email
  on public.waitlist (evento_id, ticket_type_id, lower(guest_email))
  where estado in ('esperando', 'promovido');

alter table public.waitlist enable row level security;

/* Owner del evento ve/gestiona su waitlist. Insert público lo hace el backend
   con service_role (la página pública no usa auth). */
drop policy if exists waitlist_owner_all on public.waitlist;
create policy waitlist_owner_all on public.waitlist
  for all using (
    exists (select 1 from public.eventos e where e.id = waitlist.evento_id and e.owner_id = auth.uid())
  );
