-- Orden manual de los ítems dentro de cada sección.
alter table public.items
  add column if not exists position int not null default 0;

-- Los ítems existentes conservan su orden de creación.
update public.items i
set position = r.rn - 1
from (
  select id, row_number() over (partition by section_id order by created_at) as rn
  from public.items
) r
where r.id = i.id;
