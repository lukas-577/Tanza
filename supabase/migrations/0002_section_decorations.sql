-- Imágenes decorativas que se muestran al lado de una sección (por ejemplo, estrellas).
alter table public.sections
  add column if not exists decorations text[] not null default '{}';
